/**
 * TMarks 批量导入组件 - 重构版
 */

import { UploadStep } from './UploadStep'
import { ImportStep as ImportStepComponent } from './ImportStep'
import { AIOrganizeStep } from './AIOrganizeStep'
import { EditableBookmarkTable, type EditableBookmark } from './EditableBookmarkTable'
import { ImportStepIndicator } from './ImportStepIndicator'
import { useBookmarkImport, useTMarksData, useTMarksImport } from './hooks'

interface TMarksImportProps {
  formData: any
  setSuccessMessage: (msg: string) => void
  setError: (msg: string) => void
  onBack: () => void
}

export function TMarksImport({ formData, setSuccessMessage, setError }: TMarksImportProps) {
  const importState = useBookmarkImport({
    mode: 'tmarks',
    storageKey: 'tmarks_import_progress',
    defaultOptions: {
      includeThumbnail: formData.defaultIncludeThumbnail ?? false,
      createSnapshot: formData.defaultCreateSnapshot ?? false
    }
  })

  const { existingTags } = useTMarksData()
  const tmarksImport = useTMarksImport(formData)

  // HTML 格式不再强制启用 AI
  const isAiRequired = false

  const handleStartImport = () => {
    const uploadData = {
      format: importState.selectedFormat,
      normalizeResult: importState.normalizeResult || undefined,
      options: importState.importOptions
    }

    importState.completeCurrentStep(uploadData)
    importState.updateStepData('upload', uploadData)

    if (importState.enableAiOrganize) {
      // 启用 AI 整理，进入 AI 步骤
      importState.goToNextStep()
    } else {
      // 不启用 AI，使用文件夹名作为标签
      if (importState.normalizeResult?.parsedBookmarks) {
        const bookmarksWithFolderTags: EditableBookmark[] =
          importState.normalizeResult.parsedBookmarks.map(b => ({
            url: b.url,
            title: b.title || b.url,
            description: b.description || '',
            // 将文件夹路径转换为标签（如 "开发/前端/React" → ["开发", "前端", "React"]）
            tags: b.folder
              ? b.folder.split('/').map(f => ({
                  name: f.trim(),
                  isNew: true,
                  confidence: 1
                })).filter(t => t.name)
              : [],
            isSelected: true,
            isSkipped: false
          }))
        importState.setBookmarks(bookmarksWithFolderTags)
        importState.updateStepData('edit', { bookmarks: bookmarksWithFolderTags })
      } else if (importState.normalizeResult) {
        // 没有 parsedBookmarks，使用旧的 URL 列表方式
        const basicBookmarks: EditableBookmark[] = importState.normalizeResult.validUrls.map(url => ({
          url,
          title: url,
          description: '',
          tags: [],
          isSelected: true,
          isSkipped: false
        }))
        importState.setBookmarks(basicBookmarks)
        importState.updateStepData('edit', { bookmarks: basicBookmarks })
      }
      // 使用 goToNextStep 而不是 goToStep，避免被 canGoToStep 阻止
      importState.goToNextStep()
    }
  }

  const handleAIOrganizeComplete = (organizedBookmarks: EditableBookmark[]) => {
    importState.setBookmarks(organizedBookmarks)
    importState.completeCurrentStep({ bookmarks: organizedBookmarks })
    importState.updateStepData('aiOrganize', { bookmarks: organizedBookmarks })
    importState.goToNextStep()
  }

  const handleFinalImport = (bookmarksToImport: EditableBookmark[]) => {
    tmarksImport.handleFinalImport(
      bookmarksToImport,
      importState.importOptions,
      importState.setIsImporting,
      setSuccessMessage,
      setError,
      importState.goToNextStep,
      importState.completeCurrentStep
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-[var(--tab-options-title)] mb-2">
          {chrome.i18n.getMessage('import_title')}
        </h3>
        <p className="text-sm text-[var(--tab-options-text)]">
          将书签导入到 TMarks 书签管理系统
        </p>
      </div>

      <ImportStepIndicator
        currentStep={importState.currentStep}
        enableAiOrganize={importState.enableAiOrganize}
        completedSteps={importState.completedSteps}
        onStepClick={importState.goToStep}
        canNavigate={true}
      />

      {importState.currentStep === 'upload' && (
        <UploadStep
          selectedFormat={importState.selectedFormat}
          setSelectedFormat={importState.setSelectedFormat}
          selectedFile={importState.selectedFile}
          isValidating={importState.isValidating}
          normalizeResult={importState.normalizeResult}
          normalizeProgress={importState.normalizeProgress}
          enableAiOrganize={importState.enableAiOrganize}
          setEnableAiOrganize={importState.setEnableAiOrganize}
          isAiRequired={isAiRequired}
          options={importState.importOptions}
          setOptions={importState.setImportOptions}
          onFileSelect={importState.setSelectedFile}
          onReset={importState.handleReset}
          onStartImport={handleStartImport}
        />
      )}

      {importState.currentStep === 'aiOrganize' && importState.normalizeResult && importState.aiConfig && (
        <AIOrganizeStep
          urls={importState.normalizeResult.validUrls}
          provider={importState.aiConfig.provider}
          apiKey={importState.aiConfig.apiKey}
          model={importState.aiConfig.model}
          apiUrl={importState.aiConfig.apiUrl}
          existingTags={existingTags}
          existingFolders={[]}
          mode="tmarks"
          onComplete={handleAIOrganizeComplete}
          onBack={importState.goToPreviousStep}
        />
      )}

      {importState.currentStep === 'edit' && (
        <div className="space-y-4">
          <EditableBookmarkTable
            bookmarks={importState.bookmarks}
            existingTags={existingTags}
            mode="tmarks"
            onBookmarksChange={(updatedBookmarks) => {
              importState.setBookmarks(updatedBookmarks)
              importState.updateStepData('edit', { bookmarks: updatedBookmarks })
            }}
          />
          <div className="flex gap-3">
            <button
              onClick={importState.goToPreviousStep}
              className="flex-1 px-6 py-3 border border-[var(--tab-options-button-border)] text-[var(--tab-options-button-text)] rounded-lg hover:bg-[var(--tab-options-button-hover-bg)] transition-colors"
            >
              返回
            </button>
            <button
              onClick={() => handleFinalImport(importState.bookmarks)}
              disabled={importState.isImporting || importState.bookmarks.filter(b => b.isSelected).length === 0}
              className="flex-1 px-6 py-3 bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] rounded-lg hover:bg-[var(--tab-options-button-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {importState.isImporting ? '导入中...' : `导入 ${importState.bookmarks.filter(b => b.isSelected).length} 个书签`}
            </button>
          </div>
        </div>
      )}

      {importState.currentStep === 'import' && (
        <ImportStepComponent
          bookmarks={tmarksImport.parsedBookmarks}
          isImporting={importState.isImporting}
          importProgress={tmarksImport.importProgress}
          importResult={tmarksImport.importResult}
          onImport={async (bookmarks) => {
            importState.setIsImporting(true)
            tmarksImport.setImportProgress({ current: 0, total: 100, status: '正在导入...' })

            try {
              const { importToTMarks } = await import('@/lib/import/api')
              const config = await import('@/lib/utils/storage').then(m => m.StorageService.loadConfig())
              const tmarksUrl = config.bookmarkSite.apiUrl?.replace(/\/api$/, '') || 'https://tmarks.example.com'
              const accessToken = config.bookmarkSite.apiKey || formData.tmarksAccessToken

              if (!accessToken) {
                throw new Error('未配置 TMarks API Key，请先在设置中配置')
              }

              const result = await importToTMarks(bookmarks, importState.importOptions, tmarksUrl, accessToken)
              tmarksImport.setImportResult(result)
              
              if (result.failed > 0 && result.imported === 0) {
                // 全部失败
                const firstError = result.errors?.[0]
                const errorMsg = typeof firstError === 'string' ? firstError : firstError?.error || '导入失败'
                throw new Error(errorMsg)
              } else if (result.failed > 0) {
                // 部分失败
                setSuccessMessage(`成功导入 ${result.imported} 个书签，${result.failed} 个失败`)
              } else {
                // 全部成功
                setSuccessMessage(`成功导入 ${result.imported} 个书签`)
              }
            } catch (error) {
              setError(error instanceof Error ? error.message : '导入失败')
            } finally {
              importState.setIsImporting(false)
              tmarksImport.setImportProgress(null)
            }
          }}
        />
      )}
    </div>
  )
}
