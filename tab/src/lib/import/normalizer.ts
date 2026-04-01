/**
 * 书签 URL 标准化处理器
 * 第一步：从解析的书签中提取纯净的 URL 列表
 */

import type { ParsedBookmark } from '@/types/import'

export interface NormalizeResult {
  validUrls: string[]
  parsedBookmarks: ParsedBookmark[]  // 保留完整的书签信息（包含 folder）
  stats: {
    total: number
    valid: number
    duplicates: number
    invalid: number
    invalidReasons: Record<string, number>
  }
}

export interface NormalizeProgress {
  current: number
  total: number
  status: string
}

/**
 * 分批标准化书签（不自动下载）
 */
export async function normalizeBookmarksWithStream(
  bookmarks: ParsedBookmark[],
  onProgress?: (progress: NormalizeProgress) => void
): Promise<NormalizeResult> {
  const batchSize = 1000
  const urlSet = new Set<string>()
  const validBookmarks: ParsedBookmark[] = []  // 保留有效书签
  const invalidReasons: Record<string, number> = {}
  let duplicateCount = 0

  onProgress?.({ current: 0, total: bookmarks.length, status: '开始处理...' })

  for (let i = 0; i < bookmarks.length; i += batchSize) {
    const batch = bookmarks.slice(i, i + batchSize)
    const batchEnd = Math.min(i + batchSize, bookmarks.length)

    for (const bookmark of batch) {
      const url = bookmark.url?.trim()

      if (!url) {
        incrementReason(invalidReasons, '空 URL')
        continue
      }

      const validationResult = validateUrl(url)
      if (!validationResult.valid) {
        incrementReason(invalidReasons, validationResult.reason!)
        continue
      }

      if (urlSet.has(url)) {
        duplicateCount++
        continue
      }

      urlSet.add(url)
      validBookmarks.push(bookmark)  // 保留有效书签
    }

    onProgress?.({
      current: batchEnd,
      total: bookmarks.length,
      status: `已处理 ${batchEnd} / ${bookmarks.length}，提取 ${urlSet.size} 个有效 URL`
    })

    await new Promise(resolve => setTimeout(resolve, 0))
  }

  onProgress?.({
    current: bookmarks.length,
    total: bookmarks.length,
    status: '处理完成'
  })

  return {
    validUrls: Array.from(urlSet),
    parsedBookmarks: validBookmarks,  // 返回有效书签列表
    stats: {
      total: bookmarks.length,
      valid: urlSet.size,
      duplicates: duplicateCount,
      invalid: bookmarks.length - urlSet.size - duplicateCount,
      invalidReasons
    }
  }
}

/**
 * 分批标准化书签（不自动下载）
 */
export async function normalizeBookmarksInBatches(
  bookmarks: ParsedBookmark[],
  onProgress?: (progress: NormalizeProgress) => void
): Promise<NormalizeResult> {
  const batchSize = 1000
  const urlSet = new Set<string>()
  const validBookmarks: ParsedBookmark[] = []  // 保留有效书签
  const invalidReasons: Record<string, number> = {}
  let duplicateCount = 0

  onProgress?.({ current: 0, total: bookmarks.length, status: '开始处理...' })

  for (let i = 0; i < bookmarks.length; i += batchSize) {
    const batch = bookmarks.slice(i, i + batchSize)
    const batchEnd = Math.min(i + batchSize, bookmarks.length)

    for (const bookmark of batch) {
      const url = bookmark.url?.trim()

      if (!url) {
        incrementReason(invalidReasons, '空 URL')
        continue
      }

      const validationResult = validateUrl(url)
      if (!validationResult.valid) {
        incrementReason(invalidReasons, validationResult.reason!)
        continue
      }

      if (urlSet.has(url)) {
        duplicateCount++
        continue
      }

      urlSet.add(url)
      validBookmarks.push(bookmark)  // 保留有效书签
    }

    onProgress?.({
      current: batchEnd,
      total: bookmarks.length,
      status: `已处理 ${batchEnd} / ${bookmarks.length}`
    })

    await new Promise(resolve => setTimeout(resolve, 0))
  }

  onProgress?.({
    current: bookmarks.length,
    total: bookmarks.length,
    status: '处理完成'
  })

  return {
    validUrls: Array.from(urlSet),
    parsedBookmarks: validBookmarks,  // 返回有效书签列表
    stats: {
      total: bookmarks.length,
      valid: urlSet.size,
      duplicates: duplicateCount,
      invalid: bookmarks.length - urlSet.size - duplicateCount,
      invalidReasons
    }
  }
}

/**
 * 标准化书签（同步版本，用于小文件）
 */
export function normalizeBookmarks(bookmarks: ParsedBookmark[]): NormalizeResult {
  const urlSet = new Set<string>()
  const validBookmarks: ParsedBookmark[] = []  // 保留有效书签
  const invalidReasons: Record<string, number> = {}
  let duplicateCount = 0

  for (const bookmark of bookmarks) {
    const url = bookmark.url?.trim()

    if (!url) {
      incrementReason(invalidReasons, '空 URL')
      continue
    }

    const validationResult = validateUrl(url)
    if (!validationResult.valid) {
      incrementReason(invalidReasons, validationResult.reason!)
      continue
    }

    if (urlSet.has(url)) {
      duplicateCount++
      continue
    }

    urlSet.add(url)
    validBookmarks.push(bookmark)  // 保留有效书签
  }

  return {
    validUrls: Array.from(urlSet),
    parsedBookmarks: validBookmarks,  // 返回有效书签列表
    stats: {
      total: bookmarks.length,
      valid: urlSet.size,
      duplicates: duplicateCount,
      invalid: bookmarks.length - urlSet.size - duplicateCount,
      invalidReasons
    }
  }
}

/**
 * 下载 URL 列表为 txt 文件
 */
export function downloadUrlList(urls: string[]): string {
  const content = urls.join('\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const filename = `bookmarks-urls-${Date.now()}.txt`
  
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  
  URL.revokeObjectURL(url)
  
  return filename
}

/**
 * 验证 URL 是否有效
 */
function validateUrl(url: string): { valid: boolean; reason?: string } {
  if (url.startsWith('javascript:')) {
    return { valid: false, reason: 'JavaScript 伪协议' }
  }
  if (url.startsWith('data:')) {
    return { valid: false, reason: 'Data URL' }
  }
  if (url.startsWith('about:')) {
    return { valid: false, reason: 'About 页面' }
  }
  if (url.startsWith('chrome:')) {
    return { valid: false, reason: 'Chrome 内部页面' }
  }
  if (url.startsWith('chrome-extension:')) {
    return { valid: false, reason: 'Chrome 扩展' }
  }
  if (url.startsWith('edge:')) {
    return { valid: false, reason: 'Edge 内部页面' }
  }
  if (url.startsWith('file:')) {
    return { valid: false, reason: '本地文件' }
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { valid: false, reason: '非 HTTP(S) 协议' }
  }
  
  try {
    const urlObj = new URL(url)
    
    if (!urlObj.hostname || urlObj.hostname === 'localhost') {
      return { valid: false, reason: '无效域名' }
    }
    
    return { valid: true }
  } catch {
    return { valid: false, reason: 'URL 格式错误' }
  }
}

/**
 * 增加无效原因计数
 */
function incrementReason(reasons: Record<string, number>, reason: string) {
  reasons[reason] = (reasons[reason] || 0) + 1
}
