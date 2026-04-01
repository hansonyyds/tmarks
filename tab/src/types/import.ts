/**
 * 导入功能相关类型定义
 */

// 导入格式类型
export type ImportFormat = 'html' | 'json' | 'txt';

// 导入步骤类型
export type ImportStepType = 'select-file' | 'parse-data' | 'ai-organize' | 'confirm' | 'importing' | 'upload' | 'aiOrganize' | 'edit' | 'import';

// 书签数据结构
export interface BookmarkData {
  title: string;
  url: string;
  folder?: string;
  tags?: string[];
  description?: string;
}

// 可编辑书签（扩展 BookmarkData）
export interface EditableBookmark extends Omit<BookmarkData, 'tags'> {
  id?: string;
  selected?: boolean;
  tags: Array<{
    name: string;
    isNew: boolean;
    confidence: number;
  }> | string[];
  isSelected?: boolean;
  isSkipped?: boolean;
}

// 标准化结果
export interface NormalizeResult {
  validUrls: string[];
  parsedBookmarks: ParsedBookmark[];  // 保留完整的书签信息（包含 folder）
  stats: {
    total: number;
    valid: number;
    duplicates: number;
    invalid: number;
    invalidReasons: Record<string, number>;
  };
}

// 步骤数据
export interface ImportStepData {
  // 文件上传步骤
  file?: File;
  fileName?: string;
  
  // upload 步骤数据
  upload?: {
    format: ImportFormat;
    normalizeResult: NormalizeResult;
    options: ImportOptions;
    file?: File;
  };
  
  // aiOrganize 步骤数据
  aiOrganize?: {
    bookmarks: BookmarkData[] | EditableBookmark[];
  };
  
  // edit 步骤数据
  edit?: {
    bookmarks: BookmarkData[] | EditableBookmark[];
  };
  
  // 解析数据（兼容旧格式）
  parsedData?: {
    bookmarks: Array<{
      title: string;
      url: string;
      folder?: string;
    }>;
    totalCount: number;
  };
  
  // 组织后的数据（兼容旧格式）
  organizedData?: {
    folders: Array<{
      name: string;
      bookmarks: Array<{
        title: string;
        url: string;
      }>;
    }>;
  };
  
  // 导入结果
  importResult?: {
    success: number;
    failed: number;
    errors: string[];
  };
  
  // 通用字段
  bookmarks?: BookmarkData[] | EditableBookmark[];
  result?: ImportResult;
  format?: ImportFormat;
  normalizeResult?: NormalizeResult;
  options?: ImportOptions;
}

// 导入进度恢复数据
export interface ImportProgressData {
  currentStep: ImportStepType;
  completedSteps: ImportStepType[];
  stepData: ImportStepData;
  timestamp: number;
  
  // 兼容旧格式
  upload?: ImportStepData['upload'];
  aiOrganize?: ImportStepData['aiOrganize'];
  edit?: ImportStepData['edit'];
}

// 解析后的书签数据
export interface ParsedBookmark {
  title: string;
  url: string;
  description?: string;
  tags?: string[];
  created_at?: string;
  folder?: string;
}

// 导入选项
export interface ImportOptions {
  skipDuplicates?: boolean;
  skip_duplicates?: boolean; // 兼容旧格式
  mergeMode?: 'replace' | 'merge' | 'skip';
  targetFolder?: string;
  preserveFolders?: boolean;
  preserveTags?: boolean;
  create_missing_tags?: boolean;
  preserve_timestamps?: boolean;
  folder_as_tag?: boolean;
  includeThumbnail?: boolean;
  createSnapshot?: boolean;
  generateTags?: boolean;
}

// 导入结果
export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  failed: number;
  total?: number;
  errors?: Array<{
    item: { title?: string; url?: string };
    error: string;
  }> | string[];
  message?: string;
}
