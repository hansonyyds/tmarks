/**
 * TMarks 导入处理 Hook
 */

import { useState } from 'react'
import { logger } from '@/lib/utils/logger'
import { StorageService } from '@/lib/utils/storage'
import type { ParsedBookmark, ImportResult } from '@/types/import'
import type { EditableBookmark } from '../EditableBookmarkTable'

export function useTMarksImport(formData: any) {
  const [parsedBookmarks, setParsedBookmarks] = useState<ParsedBookmark[]>([])
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; status: string } | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleFinalImport = async (
    bookmarksToImport: EditableBookmark[],
    options: any,
    setIsImporting: (val: boolean) => void,
    setSuccessMessage: (msg: string) => void,
    setError: (msg: string) => void,
    goToNextStep: () => void,
    completeCurrentStep: (data: any) => void
  ) => {
    setIsImporting(true)
    setImportProgress({ current: 0, total: 100, status: '正在导入...' })

    try {
      const { importToTMarks } = await import('@/lib/import/api')
      
      const config = await StorageService.loadConfig()
      const tmarksUrl = config.bookmarkSite.apiUrl?.replace(/\/api$/, '') || 'https://tmarks.example.com'
      const accessToken = config.bookmarkSite.apiKey || formData.tmarksAccessToken

      if (!accessToken) {
        throw new Error('未配置 TMarks API Key，请先在设置中配置')
      }

      const parsedBookmarks: ParsedBookmark[] = bookmarksToImport
        .filter(b => b.isSelected && !b.isSkipped)
        .filter(b => b.url && b.url.trim() && b.title && b.title.trim()) // 过滤掉空 URL 或空标题
        .map(b => ({
          url: b.url.trim(),
          title: b.title.trim(),
          description: b.description?.trim() || '',
          // 处理 tags 可能是对象数组或字符串数组的情况
          tags: b.tags.map(t => typeof t === 'string' ? t : t.name),
          addDate: Date.now(),
          icon: ''
        }))

      const result = await importToTMarks(parsedBookmarks, options, tmarksUrl, accessToken)
      
      setImportResult(result)
      setSuccessMessage(`成功导入 ${result.success} 个书签`)
      setParsedBookmarks(parsedBookmarks)
      
      completeCurrentStep({ bookmarks: bookmarksToImport, result })
      goToNextStep()
    } catch (error) {
      logger.error('TMarks import failed', error)
      setError(error instanceof Error ? error.message : '导入失败')
    } finally {
      setIsImporting(false)
      setImportProgress(null)
    }
  }

  return {
    parsedBookmarks,
    setParsedBookmarks,
    importProgress,
    setImportProgress,
    importResult,
    setImportResult,
    handleFinalImport
  }
}
