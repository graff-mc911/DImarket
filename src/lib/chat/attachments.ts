import { supabase } from '../supabase'

const BUCKET = 'chat-media'

function attachmentType(mime: string): 'image' | 'pdf' | 'document' | 'other' {
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'pdf'
  if (mime.includes('document') || mime.includes('word') || mime.includes('sheet')) return 'document'
  return 'other'
}

export async function uploadChatAttachment(
  file: File,
  conversationId: string,
  userId: string,
): Promise<{ path: string; publicUrl: string; mime: string; type: ReturnType<typeof attachmentType> } | null> {
  const ext = file.name.split('.').pop() || 'bin'
  const path = `messages/${conversationId}/${userId}/${Date.now()}.${ext}`

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
    type: attachmentType(file.type || ''),
  }
}

export async function attachToMessage(
  messageId: string,
  upload: { path: string; publicUrl: string; mime: string; type: string; fileName: string; size: number },
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
