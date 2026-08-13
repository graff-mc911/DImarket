import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Owner-only: delete a commercial agent/manufacturer auth user after the
 * commercial profile row was removed (or remove both via service role).
 *
 * Body: { kind: 'agent'|'manufacturer', id: uuid, deleteAuth?: boolean }
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OWNER_EMAIL = "ivan.sovban@gmail.com";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, is_site_owner, user_role")
      .eq("id", user.id)
      .maybeSingle();

    const email = (user.email || "").trim().toLowerCase();
    const isOwner =
      profile?.is_site_owner === true ||
      profile?.user_role === "owner" ||
      email === OWNER_EMAIL.toLowerCase();

    if (!isOwner) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const kind = body?.kind === "manufacturer" ? "manufacturer" : "agent";
    const id = String(body?.id || "");
    const deleteAuth = body?.deleteAuth !== false;
    if (!id) {
      return new Response(JSON.stringify({ error: "id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const table = kind === "manufacturer" ? "manufacturer_profiles" : "agent_profiles";
    const { data: row } = await supabaseAdmin
      .from(table)
      .select("id, profile_id, slug")
      .eq("id", id)
      .maybeSingle();

    let profileId = row?.profile_id as string | undefined;

    if (row) {
      if (kind === "agent") {
        await supabaseAdmin
          .from("ad_campaigns")
          .update({
            status: "rejected",
            agent_profile_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("agent_profile_id", id)
          .eq("status", "active");
      } else {
        await supabaseAdmin
          .from("ad_campaigns")
          .update({
            status: "rejected",
            manufacturer_profile_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("manufacturer_profile_id", id)
          .eq("status", "active");
      }

      const { error: delErr } = await supabaseAdmin.from(table).delete().eq("id", id);
      if (delErr) {
        return new Response(JSON.stringify({ error: delErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (body?.profileId) {
      profileId = String(body.profileId);
    }

    let authDeleted = false;
    if (deleteAuth && profileId) {
      // Never delete the site owner account via this path.
      const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(profileId);
      const targetEmail = (targetUser?.user?.email || "").toLowerCase();
      if (targetEmail === OWNER_EMAIL.toLowerCase() || profileId === user.id) {
        return new Response(
          JSON.stringify({
            ok: true,
            profileDeleted: Boolean(row),
            authDeleted: false,
            note: "Refused to delete owner or self auth user",
            profileId,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(profileId);
      if (authErr) {
        return new Response(
          JSON.stringify({
            ok: true,
            profileDeleted: Boolean(row),
            authDeleted: false,
            authError: authErr.message,
            profileId,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      authDeleted = true;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        kind,
        id,
        profileDeleted: Boolean(row),
        authDeleted,
        profileId: profileId ?? null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
