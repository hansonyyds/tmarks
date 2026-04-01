/**
 * AI 整理开关 Section
 */

import { Sparkles } from 'lucide-react'
import type { NormalizeResult } from '@/lib/import/normalizer'

interface AIToggleSectionProps {
  enableAiOrganize: boolean
  setEnableAiOrganize: (enable: boolean) => void
  isAiRequired?: boolean  // 保留参数但标记为可选，用于向后兼容
  selectedFile: File | null
  normalizeResult: NormalizeResult | null
}

export function AIToggleSection({
  enableAiOrganize,
  setEnableAiOrganize,
  selectedFile,
  normalizeResult
}: AIToggleSectionProps) {
  // 获取文件夹数量统计
  const folderCount = normalizeResult?.parsedBookmarks?.filter(b => b.folder).length || 0

  return (
    <div className={`p-4 rounded-lg border ${enableAiOrganize ? 'bg-[var(--tab-message-info-bg)] border-[var(--tab-message-info-border)]' : 'bg-[var(--tab-options-card-bg)] border-[var(--tab-options-button-border)]'}`}>
      <label className="flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${enableAiOrganize ? 'bg-[var(--tab-message-info-icon)] text-[var(--tab-message-info-icon-text)]' : 'bg-[var(--tab-options-button-hover-bg)]'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--tab-options-title)]">
              {chrome.i18n.getMessage('import_enable_ai')}
            </div>
            <div className="text-xs text-[var(--tab-options-text)]">
              {selectedFile && normalizeResult
                ? enableAiOrganize
                  ? `已提取 ${normalizeResult.validUrls.length} 个有效 URL，将使用 AI 生成标签`
                  : `已提取 ${normalizeResult.validUrls.length} 个有效 URL${folderCount > 0 ? `，${folderCount} 个包含文件夹信息` : ''}`
                : chrome.i18n.getMessage('import_ai_hint')
              }
              {!enableAiOrganize && selectedFile && normalizeResult && (
                <span className="block mt-1 text-[var(--tab-message-info-icon)]">
                  {folderCount > 0
                    ? '将使用文件夹名作为标签'
                    : '将不添加标签，可在编辑步骤手动添加'}
                </span>
              )}
            </div>
          </div>
        </div>
        <input
          type="checkbox"
          checked={enableAiOrganize}
          onChange={(e) => setEnableAiOrganize(e.target.checked)}
          className="w-5 h-5"
        />
      </label>
    </div>
  )
}
