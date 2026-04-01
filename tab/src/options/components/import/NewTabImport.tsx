/**
 * NewTab 批量导入组件 - 重构版
 */

import { ArrowLeft } from 'lucide-react'
import { UploadStep } from './UploadStep'
import { AIOrganizeStep } from './AIOrganizeStep'
import { EditableBookmarkTable, type EditableBookmark } from './EditableBookmarkTable'
import { ImportStepIndicator } from './ImportStepIndicator'
import { useBookmarkImport, useNewTabData, useNewTabImport } from './hooks'
import { t } from '@/lib/i18n'

interface NewTabImportProps {
  setSuccessMessage: (msg: string) => void
  setError: (msg: string) => void
  onBack: () => void
}

export function NewTabImport({ setSuccessMessage, setError, onBack }: NewTabImportProps) {
  const importState = useBookmarkImport({
    mode: 'newtab',
    storageKey: 'newtab_import_progress',
    defaultOptions: {
      skip_duplicates: true
    }
  })

  const { existingFolders } = useNewTabData()
  const { handleFinalImport } = useNewTabImport()

  const handleStartImport = async () => {
    if (!importState.normalizeResult || importState.normalizeResult.validUrls.length === 0) {
      setError(t('import_no_valid_urls'))
      return
    }

    const uploadData = {
      format: importState.selectedFormat,
      normalizeResult: importState.normalizeResult,
      options: importState.importOptions
    }

    importState.completeCurrentStep(uploadData)
    importState.updateStepData('upload', uploadData)

    if (importState.enableAiOrganize) {
      // 启用 AI 整理，进入 AI 步骤
      importState.goToNextStep()
    } else {
      // 不启用 AI，使用文件夹信息
      if (importState.normalizeResult.parsedBookmarks) {
        const bookmarksWithFolder: EditableBookmark[] =
          importState.normalizeResult.parsedBookmarks.map(b => ({
            url: b.url,
            title: b.title || b.url,
            description: b.description || '',
            tags: [],
            // NewTab 模式使用文件夹，取第一个文件夹名或默认"未分类"
            folder: b.folder ? b.folder.split('/')[0]?.trim() || '未分类' : '未分类',
            isSelected: true,
            isSkipped: false
          }))
        importState.setBookmarks(bookmarksWithFolder)
        importState.updateStepData('edit', { bookmarks: bookmarksWithFolder })
      } else {
        // 没有 parsedBookmarks，使用旧的 URL 列表方式
        const basicBookmarks: EditableBookmark[] = importState.normalizeResult.validUrls.map(url => ({
          url,
          title: url,
          description: '',
          tags: [],
          folder: '未分类',
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

  const handleImport = (bookmarksToImport: EditableBookmark[]) => {
    handleFinalImport(
      bookmarksToImport,
      importState.importOptions,
      importState.setIsImporting,
      setSuccessMessage,
      setError,
      importState.goToNextStep,
      importState.completeCurrentStep
    )
  }

  // HTML 格式不再强制启用 AI
  const isAiRequired = false

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[var(--tab-options-text)] hover:text-[var(--tab-options-title)] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('btn_back')}
      </button>

      <ImportStepIndicator
        currentStep={importState.currentStep}
        enableAiOrganize={importState.enableAiOrganize}
        completedSteps={importState.completedSteps}
        onStepClick={importState.goToStep}
        canNavigate={true}
      />

      <div className="relative overflow-hidden rounded-2xl border border-[color:var(--tab-options-card-border)] bg-[color:var(--tab-options-card-bg)] shadow-sm backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-[var(--tab-popup-section-purple-badge-bg)]" />
        
        <div className="p-6 pt-10">
          <h2 className="text-xl font-semibold text-[var(--tab-options-title)] mb-6">{t('import_newtab_title')}</h2>
          
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
              existingTags={[]}
              existingFolders={existingFolders}
              mode="newtab"
              onComplete={handleAIOrganizeComplete}
              onBack={importState.goToPreviousStep}
            />
          )}

          {importState.currentStep === 'edit' && (
            <div className="space-y-4">
              <EditableBookmarkTable
                bookmarks={importState.bookmarks}
                existingTags={[]}
                mode="newtab"
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
                  onClick={() => handleImport(importState.bookmarks)}
                  disabled={importState.isImporting || importState.bookmarks.filter(b => b.isSelected).length === 0}
                  className="flex-1 px-6 py-3 bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] rounded-lg hover:bg-[var(--tab-options-button-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {importState.isImporting ? '导入中...' : `导入 ${importState.bookmarks.filter(b => b.isSelected).length} 个书签`}
                </button>
              </div>
            </div>
          )}

          {importState.currentStep === 'import' && (
            <div className="space-y-4">
              <div className="p-6 bg-[var(--tab-message-success-bg)] rounded-xl border border-[var(--tab-message-success-border)]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--tab-message-success-icon)] flex items-center justify-center">
                    <svg className="w-6 h-6 text-[var(--tab-message-success-icon-text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--tab-options-title)]">导入完成</h3>
                    <p className="text-sm text-[var(--tab-options-text)] mt-1">
                      书签已成功导入到 NewTab
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={importState.handleReset}
                className="w-full px-6 py-3 bg-[var(--tab-options-button-primary-bg)] text-[var(--tab-options-button-primary-text)] rounded-lg hover:bg-[var(--tab-options-button-primary-hover)]"
              >
                继续导入
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
