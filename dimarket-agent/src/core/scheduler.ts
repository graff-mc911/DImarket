import { Queue, Worker } from 'bullmq'
import IORedis from 'ioredis'

const QUEUE_NAME = 'marketing-posts'

let queue: Queue | null = null

function redisConnection(): IORedis | null {
  const url = process.env.REDIS_URL
  if (!url) return null
  return new IORedis(url, { maxRetriesPerRequest: null })
}

export function getMarketingQueue(): Queue | null {
  if (queue) return queue
  const conn = redisConnection()
  if (!conn) return null
  queue = new Queue(QUEUE_NAME, { connection: conn })
  return queue
}

export async function schedulePost(
  postId: string,
  runAt: Date,
): Promise<boolean> {
  const q = getMarketingQueue()
  if (!q) return false
  const delay = Math.max(0, runAt.getTime() - Date.now())
  await q.add('publish', { postId }, { delay, jobId: postId, removeOnComplete: true })
  return true
}

export function startPublishWorker(
  handler: (postId: string) => Promise<void>,
): Worker | null {
  const conn = redisConnection()
  if (!conn) return null
  return new Worker(
    QUEUE_NAME,
    async (job) => {
      const postId = String(job.data.postId ?? '')
      if (postId) await handler(postId)
    },
    { connection: conn },
  )
}

export function frequencyToCron(freq: 'hourly' | 'daily' | 'weekly'): string {
  switch (freq) {
    case 'hourly':
      return '0 * * * *'
    case 'weekly':
      return '0 9 * * 1'
    default:
      return '0 9 * * *'
  }
}
