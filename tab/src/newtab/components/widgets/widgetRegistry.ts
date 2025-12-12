/**
 * 组件注册表 - 管理所有可用组件的元数据
 */

import type { GridItemType, WidgetMeta, WidgetConfig, GridItemSize } from '../../types';

// 组件注册表
export const WIDGET_REGISTRY: Record<GridItemType, WidgetMeta> = {
  shortcut: {
    type: 'shortcut',
    name: '快捷方式',
    icon: 'Link',
    description: '网站快捷方式',
    sizeConfig: {
      type: 'shortcut',
      defaultSize: '1x1',
      allowedSizes: ['1x1'],
      minWidth: 1,
      minHeight: 1,
    },
  },
  weather: {
    type: 'weather',
    name: '天气',
    icon: 'Cloud',
    description: '显示当前天气和未来预报',
    sizeConfig: {
      type: 'weather',
      defaultSize: '2x2',
      allowedSizes: ['2x1', '2x2', '2x3'],
      minWidth: 2,
      minHeight: 1,
    },
  },
  clock: {
    type: 'clock',
    name: '时钟',
    icon: 'Clock',
    description: '显示当前时间',
    sizeConfig: {
      type: 'clock',
      defaultSize: '2x1',
      allowedSizes: ['2x1', '2x2'],
      minWidth: 2,
      minHeight: 1,
    },
  },
  todo: {
    type: 'todo',
    name: '待办事项',
    icon: 'CheckSquare',
    description: '管理待办任务',
    sizeConfig: {
      type: 'todo',
      defaultSize: '2x2',
      allowedSizes: ['2x2', '2x3', '2x4'],
      minWidth: 2,
      minHeight: 2,
    },
  },
  notes: {
    type: 'notes',
    name: '备忘录',
    icon: 'StickyNote',
    description: '快速记录笔记',
    sizeConfig: {
      type: 'notes',
      defaultSize: '2x2',
      allowedSizes: ['2x2', '2x3', '2x4'],
      minWidth: 2,
      minHeight: 2,
    },
  },
  hotsearch: {
    type: 'hotsearch',
    name: '热搜',
    icon: 'TrendingUp',
    description: '显示热门搜索',
    sizeConfig: {
      type: 'hotsearch',
      defaultSize: '2x3',
      allowedSizes: ['2x2', '2x3', '2x4'],
      minWidth: 2,
      minHeight: 2,
    },
  },
  poetry: {
    type: 'poetry',
    name: '每日诗词',
    icon: 'BookOpen',
    description: '显示每日诗词',
    sizeConfig: {
      type: 'poetry',
      defaultSize: '2x1',
      allowedSizes: ['2x1', '2x2'],
      minWidth: 2,
      minHeight: 1,
    },
  },
};

// 获取组件元数据
export function getWidgetMeta(type: GridItemType): WidgetMeta {
  return WIDGET_REGISTRY[type];
}

// 获取组件默认配置
export function getDefaultWidgetConfig(type: GridItemType): WidgetConfig {
  switch (type) {
    case 'weather':
      return { weather: { city: '北京', unit: 'C', showForecast: true, autoLocation: false } };
    case 'clock':
      return { clock: { format: '24h', showDate: true, showSeconds: false, showLunar: false } };
    case 'todo':
      return { todo: { showCompleted: false } };
    case 'notes':
      return { notes: { content: '' } };
    case 'hotsearch':
      return { hotsearch: { type: 'baidu' } };
    case 'poetry':
      return { poetry: { autoRefresh: true } };
    default:
      return {};
  }
}

// 获取尺寸的列数和行数
export function getSizeSpan(size: GridItemSize): { cols: number; rows: number } {
  const [cols, rows] = size.split('x').map(Number);
  return { cols, rows };
}

// 检查尺寸是否允许
export function isValidSize(type: GridItemType, size: GridItemSize): boolean {
  const meta = WIDGET_REGISTRY[type];
  return meta.sizeConfig.allowedSizes.includes(size);
}
