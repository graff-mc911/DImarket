import type { GeneratedContent, PublishResult } from '../types.js'

export interface PlatformPublisher {
  readonly platform: string
  isConfigured(): boolean
  publish(content: GeneratedContent): Promise<PublishResult>
  reply?(threadId: string, message: string, languageCode: string): Promise<PublishResult>
}

export function skipped(platform: string, reason: string): PublishResult {
  return { platform: platform as PublishResult['platform'], success: false, skipped: true, error: reason }
}
