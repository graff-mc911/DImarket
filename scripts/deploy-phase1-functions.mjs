/**
 * Deploy Phase 1 edge functions via npx supabase CLI.
 * npm run deploy:phase1-functions
 */
import { spawnSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'wjlfvajloxkevggwjgtk'
const functions = ['ai-job-lead', 'marketplace-matching']

function run(args) {
  return spawnSync('npx', args, { stdio: 'inherit', shell: true, cwd: root })
}

console.log('Deploying Phase 1 edge functions to', projectRef)

for (const fn of functions) {
  console.log('\n---', fn, '---')
  const d = run(['supabase', 'functions', 'deploy', fn, '--project-ref', projectRef])
  if (d.status !== 0) {
    console.error(`
Deploy failed for ${fn}.

Якщо потрібен login:
  npx supabase login

Або в Dashboard: Project → Edge Functions → Deploy new version
  Folder: supabase/functions/${fn}
`)
    process.exit(d.status ?? 1)
  }
}

console.log('\nOK — Phase 1 edge functions deployed.')
