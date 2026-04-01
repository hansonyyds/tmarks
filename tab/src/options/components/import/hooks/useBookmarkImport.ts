/**
 * 书签导入通用 Hook
 */

import { useState, useEffect } from 'react'
import { parseBookmarksFile } from '@/lib/import/parser'
import { normalizeBookmarksWithStream, type NormalizeResult, type NormalizeProgress } from '@/lib/import/normalizer'
import { StorageService } from '@/lib/utils/storage'
import { logger } from '@/lib/utils/logger'
import type { ImportFormat, ImportOptions } from '@/types/import'
import type { AIProvider } from '@/types'
import type { EditableBookmark } from '../EditableBookmarkTable'
import { useImportSteps } from '../useImportSteps'

interface UseBookmarkImportOptions {
  mode: 'tmarks' | 'newtab'
  storageKey: string
  defaultOptions?: Partial<ImportOptions>
  onStepChange?: (step: string) => void
}

export function useBookmarkImport(options: UseBookmarkImportOptions) {
  const { mode, storageKey, defaultOptions = {}, onStepChange } = options

  // 文件和格式状态
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat>('html')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [normalizeResult, setNormalizeResult] = useState<NormalizeResult | null>(null)
  const [normalizeProgress, setNormalizeProgress] = useState<NormalizeProgress | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // 导入状态
  const [isImporting, setIsImporting] = useState(false)
  const [enableAiOrganize, setEnableAiOrganize] = useState(true)
  const [bookmarks, setBookmarks] = useState<EditableBookmark[]>([])

  // 导入选项
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    create_missing_tags: true,
    includeThumbnail: false,
    createSnapshot: false,
    generateTags: false,
    ...defaultOptions
  })

  // AI 配置
  const [aiConfig, setAiConfig] = useState<{
    provider: AIProvider
    apiKey: string
    model?: string
    apiUrl?: string
  } | null>(null)

  // 步骤管理
  const stepManager = useImportSteps({
    enableAiOrganize,
    storageKey,
    onStepChange
  })

  // 加载 AI 配置
  useEffect(() => {
    async function loadAIConfig() {
      const config = await StorageService.loadConfig()
      const provider = config.aiConfig.provider
      const apiKey = config.aiConfig.apiKeys[provider]
      
      if (provider && apiKey) {
        setAiConfig({
          provider,
          apiKey,
          model: config.aiConfig.model,
          apiUrl: config.aiConfig.apiUrls?.[provider]
        })
      }
    }
    loadAIConfig()
  }, [])

  // 文件解析
  useEffect(() => {
    async function parseFile() {
      if (!selectedFile) {
        setNormalizeResult(null)
        setNormalizeProgress(null)
        return
      }

      setIsValidating(true)
      setNormalizeProgress(null)
      
      try {
        const content = await selectedFile.text()
        const bookmarks = parseBookmarksFile(content, selectedFormat)
        
        if (bookmarks.length === 0) {
          setNormalizeResult(null)
          return
        }

        const result = await normalizeBookmarksWithStream(bookmarks, setNormalizeProgress)
        setNormalizeResult(result)
      } catch (err) {
        logger.error('Failed to parse bookmarks', err)
        setNormalizeResult(null)
      } finally {
        setIsValidating(false)
        setNormalizeProgress(null)
      }
    }

    parseFile()
  }, [selectedFile, selectedFormat])

  // 恢复进度
  useEffect(() => {
    const timer = setTimeout(() => {
      const { restored, data } = stepManager.restoreProgress()
      if (restored && data) {
        const shouldRestore = window.confirm(
          `发现未完成的 ${mode === 'tmarks' ? 'TMarks' : 'NewTab'} 导入任务，是否继续？`
        )
        if (shouldRestore) {
          if (data.upload) {
            setSelectedFormat(data.upload.format)
            setNormalizeResult(data.upload.normalizeResult)
            setImportOptions(data.upload.options)
          }
          if (data.aiOrganize) {
            setBookmarks(data.aiOrganize.bookmarks as unknown as EditableBookmark[])
          }
          if (data.edit) {
            setBookmarks(data.edit.bookmarks as unknown as EditableBookmark[])
          }
        } else {
          stepManager.resetSteps()
        }
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  const handleReset = () => {
    setSelectedFile(null)
    setNormalizeResult(null)
    setNormalizeProgress(null)
    stepManager.resetSteps()
  }

  return {
    // 文件状态
    selectedFormat,
    setSelectedFormat,
    selectedFile,
    setSelectedFile,
    normalizeResult,
    normalizeProgress,
    isValidating,

    // 导入状态
    isImporting,
    setIsImporting,
    enableAiOrganize,
    setEnableAiOrganize,
    bookmarks,
    setBookmarks,

    // 选项
    importOptions,
    setImportOptions,

    // AI 配置
    aiConfig,

    // 步骤管理
    ...stepManager,

    // 方法
    handleReset
  }
}
