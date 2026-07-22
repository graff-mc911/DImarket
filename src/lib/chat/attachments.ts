import { supabase } from '../supabase'

const BUCKET = 'chat-media'

const MAX_IMAGE_MB = 12
const MAX_VIDEO_MB = 80
const MAX_AUDIO_MB = 25
const MAX_PDF_MB = 15

export type ChatAttachmentType = 'image' | 'pdf' | 'document' | 'video' | 'voice' | 'audio' | 'other'

export const CHAT_MEDIA_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/*,application/pdf,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,.pdf,.mp3,.ogg,.wav,.m4a,.webm'

function attachmentType(mime: string, fileName = ''): ChatAttachmentType {
  const lower = (mime || '').toLowerCase()
  const name = fileName.toLowerCase()
  if (lower.startsWith('image/')) return 'image'
  if (lower === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (lower.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(name)) return 'video'
  if (lower.startsWith('audio/') || /\.(mp3|ogg|wav|m4a|webm)$/i.test(name)) {
    return name.includes('voice') || lower.includes('webm') ? 'voice' : 'audio'
  }
  if (lower.includes('document') || lower.includes('word') || lower.includes('sheet')) return 'document'
  return 'other'
}

export function validateChatMedia(file: File): string | null {
  const type = attachmentType(file.type, file.name)
  const mb = file.size / (1024 * 1024)
  if (type === 'image' && mb > MAX_IMAGE_MB) return `Images max ${MAX_IMAGE_MB} MB`
  if (type === 'video' && mb > MAX_VIDEO_MB) return `Videos max ${MAX_VIDEO_MB} MB`
  if ((type === 'voice' || type === 'audio') && mb > MAX_AUDIO_MB) return `Audio max ${MAX_AUDIO_MB} MB`
  if (type === 'pdf' && mb > MAX_PDF_MB) return `PDFs max ${MAX_PDF_MB} MB`
  if (type === 'other') return 'Unsupported file type'
  return null
}

export async function uploadChatAttachment(
  file: File,
  conversationId: string,
  userId: string,
  forceType?: ChatAttachmentType,
): Promise<{
  path: string
  publicUrl: string
  mime: string
  type: ChatAttachmentType
} | null> {
  const err = validateChatMedia(file)
  if (err) {
    console.error('uploadChatAttachment validate:', err)
    return null
  }

  const ext = file.name.split('.').pop() || 'bin'
  const path = `messages/${conversationId}/${userId}/${Date.now()}.${ext}`
  const type = forceType || attachmentType(file.type, file.name)

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  })
  if (uploadError) {
    console.error('uploadChatAttachment:', uploadError)
    return null
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return {
    path,
    publicUrl: urlData.publicUrl,
    mime: file.type || 'application/octet-stream',
    type,
  }
}

export async function attachToMessage(
  messageId: string,
  upload: {
    path: string
    publicUrl: string
    mime: string
    type: string
    fileName: string
    size: number
  },
): Promise<boolean> {
  const { error } = await supabase.from('message_attachments').insert({
    message_id: messageId,
    storage_path: upload.path,
    public_url: upload.publicUrl,
    file_name: upload.fileName,
    mime_type: upload.mime,
    file_size_bytes: upload.size,
    attachment_type: upload.type,
  })
  if (error) {
    console.error('attachToMessage:', error)
    return false
  }
  await supabase.from('messages').update({ attachment_count: 1 }).eq('id', messageId)
  return true
}

export function captionForAttachment(type: ChatAttachmentType, fileName: string): string {
  if (type === 'image') return '📷 Image'
  if (type === 'video') return '🎬 Video'
  if (type === 'voice') return '🎤 Voice message'
  if (type === 'audio') return '🔊 Audio'
  if (type === 'pdf') return `📄 ${fileName}`
  return `📎 ${fileName}`
}
