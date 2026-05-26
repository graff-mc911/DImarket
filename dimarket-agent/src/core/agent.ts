import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { generateMarketingContent } from '../content/generator.js'
import { buildShortVideoScript } from '../content/video-script.js'
import { generateImageUrl } from '../content/image-generator.js'
import { getPublisher } from '../integrations/index.js'
import { recordPublish, trackEvent } from '../analytics/tracker.js'
import { nextRoleIndex, planDailySlots } from './planner.js'
import type { AgentConfig, GeneratedContent, MarketingPlatform } from '../types.js'

export class MarketingAgent {
  private readonly supabase: SupabaseClient

  constructor(url: string, serviceKey: string) {
    this.supabase = createClient(url, serviceKey)
  }

  async loadConfig(): Promise<AgentConfig | null> {
    const { data } = await this.supabase
      .from('marketing_agent_config')
      .select('*')
      .eq('id', 'default')
      .maybeSingle()
    return data as AgentConfig | null
  }

  async fetchContentHashes(): Promise<string[]> {
    const { data } = await this.supabase
      .from('marketing_posts')
      .select('content_hash')
      .not('content_hash', 'is', null)
      .limit(500)
    return (data ?? []).map((r) => String(r.content_hash))
  }

  async runCycle(): Promise<{ created: number; published: number }> {
    const config = await this.loadConfig()
    if (!config?.is_running) return { created: 0, published: 0 }

    const hashes = await this.fetchContentHashes()
    const slots = planDailySlots(config, config.frequency === 'hourly' ? 4 : 12)
    let created = 0
    let published = 0

    for (const slot of slots) {
      const kind =
        slot.platform === 'tiktok' || slot.platform === 'youtube'
          ? 'video_script'
          : 'social_post'

      let bodyExtra = ''
      if (kind === 'video_script') {
        bodyExtra = buildShortVideoScript(
          slot.role,
          slot.market.languageCode,
          slot.market.countryCode,
        )
      }

      const { content, provider, hash } = await generateMarketingContent({
        role: slot.role,
        platform: slot.platform,
        languageCode: slot.market.languageCode,
        countryCode: slot.market.countryCode,
        kind,
        existingHashes: hashes,
      })

      if (bodyExtra) content.body = `${content.body}\n\n---\n${bodyExtra}`

      let imageUrl: string | null = null
      if (content.imagePrompt) {
        imageUrl = await generateImageUrl(content.imagePrompt)
      }

      const status = config.auto_publish ? 'approved' : 'pending_review'
      const { data: post } = await this.supabase
        .from('marketing_posts')
        .insert({
          campaign_id: null,
          role_target: slot.role,
          platform: slot.platform,
          country_code: slot.market.countryCode,
          language_code: slot.market.languageCode,
          content_kind: kind,
          title: content.title ?? null,
          body: content.body,
          hashtags: content.hashtags,
          image_prompt: content.imagePrompt ?? null,
          image_url: imageUrl,
          content_hash: hash,
          llm_provider: provider,
          status,
        })
        .select('id')
        .single()

      created++
      hashes.push(hash)

      if (config.auto_publish && post?.id) {
        const ok = await this.publishPost(String(post.id), content, slot.platform)
        if (ok) published++
      }
    }

    await this.supabase
      .from('marketing_agent_config')
      .update({
        last_run_at: new Date().toISOString(),
        next_role_index: nextRoleIndex(config.next_role_index, slots.length),
      })
      .eq('id', 'default')

    await trackEvent('cycle_complete', { created, published })
    return { created, published }
  }

  async publishPostById(postId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('marketing_posts')
      .select('*')
      .eq('id', postId)
      .single()
    if (!data) return false
    const content: GeneratedContent = {
      role: data.role_target as GeneratedContent['role'],
      platform: data.platform as MarketingPlatform,
      languageCode: data.language_code,
      countryCode: data.country_code,
      kind: data.content_kind as GeneratedContent['kind'],
      body: data.body,
      hashtags: data.hashtags ?? [],
      charCount: String(data.body).length,
      title: data.title ?? undefined,
    }
    return this.publishPost(postId, content, content.platform)
  }

  async publishPost(
    postId: string,
    content: GeneratedContent,
    platform: MarketingPlatform,
  ): Promise<boolean> {
    const publisher = getPublisher(platform)
    if (!publisher) {
      await recordPublish(postId, platform, false)
      return false
    }
    const result = await publisher.publish(content)
    await this.supabase
      .from('marketing_posts')
      .update({
        status: result.success ? 'published' : 'failed',
        published_at: result.success ? new Date().toISOString() : null,
        external_id: result.externalId ?? null,
        publish_error: result.error ?? null,
      })
      .eq('id', postId)
    await recordPublish(postId, platform, result.success)
    return result.success
  }
}
