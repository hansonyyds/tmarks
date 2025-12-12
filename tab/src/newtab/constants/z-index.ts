/**
 * NewTab z-index 层级常量
 * 合理分布各组件的层级，避免冲突
 */

export const Z_INDEX = {
  // 主内容层 (10-19)
  WEATHER: 10,
  
  // 侧边栏层 (20-29)
  SIDEBAR: 20,
  
  // 编辑模式层 (30-39)
  EDIT_BUTTONS: 30,
  
  // 底部 Dock 层 (40-49)
  DOCK: 40,
  
  // 下拉菜单/Tooltip 层 (50-59)
  DROPDOWN: 50,
  TOOLTIP: 55,
  SEARCH_DROPDOWN: 50,
  
  // 小弹窗层 (60-69)
  POPOVER: 60,
  ADD_GROUP_MENU: 65,
  
  // 模态框层 (100-119)
  MODAL_BACKDROP: 100,
  MODAL_CONTENT: 110,
  
  // 组件选择器层 (200-209) - 最高层级
  WIDGET_SELECTOR_BACKDROP: 200,
  WIDGET_SELECTOR_CONTENT: 201,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
