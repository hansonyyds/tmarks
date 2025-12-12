/**
 * NewTab 常量定义
 */

import type { SearchEngineConfig, NewTabSettings, WallpaperConfig, ShortcutGroup } from './types';

// 搜索引擎配置（精简版）
export const SEARCH_ENGINES: SearchEngineConfig[] = [
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: 'https://www.google.com/favicon.ico',
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    icon: 'https://www.bing.com/favicon.ico',
  },
  {
    id: 'zhihu',
    name: '知乎',
    url: 'https://www.zhihu.com/search?type=content&q=',
    icon: 'https://static.zhihu.com/heifetz/favicon.ico',
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/search?q=',
    icon: 'https://github.com/favicon.ico',
  },
  {
    id: 'bilibili',
    name: 'B站',
    url: 'https://search.bilibili.com/all?keyword=',
    icon: 'https://www.bilibili.com/favicon.ico',
  },
];

// 默认壁纸配置
export const DEFAULT_WALLPAPER: WallpaperConfig = {
  type: 'bing',
  value: '',
  blur: 0,
  brightness: 100,
};

// 默认设置
export const DEFAULT_SETTINGS: NewTabSettings = {
  showClock: true,
  clockFormat: '24h',
  showDate: true,
  showSeconds: false,
  showSearch: true,
  searchEngine: 'google',
  showShortcuts: true,
  shortcutColumns: 8, // 支持 6 | 8 | 10
  shortcutStyle: 'icon',
  wallpaper: DEFAULT_WALLPAPER,
  showPinnedBookmarks: true,
  enableSearchSuggestions: true,
  autoRefreshPinnedBookmarks: true,
  pinnedBookmarksRefreshTime: 'morning',
  showGreeting: true,
  userName: '',
  showLunar: true,
  showPoetry: true,
  hotSearchType: 'baidu',
};

// 热搜类型配置
export const HOT_SEARCH_TYPES = [
  { id: 'baidu', name: '百度热搜' },
  { id: 'weibo', name: '微博热搜' },
  { id: 'zhihu', name: '知乎热榜' },
  { id: 'bilibili', name: 'B站热门' },
] as const;

// 默认诗词库
export const DEFAULT_POETRY = [
  { content: '海内存知己，天涯若比邻。', author: '王勃', title: '送杜少府之任蜀州' },
  { content: '落霞与孤鹜齐飞，秋水共长天一色。', author: '王勃', title: '滕王阁序' },
  { content: '人生得意须尽欢，莫使金樽空对月。', author: '李白', title: '将进酒' },
  { content: '长风破浪会有时，直挂云帆济沧海。', author: '李白', title: '行路难' },
  { content: '会当凌绝顶，一览众山小。', author: '杜甫', title: '望岳' },
  { content: '读书破万卷，下笔如有神。', author: '杜甫', title: '奉赠韦左丞丈二十二韵' },
  { content: '春风得意马蹄疾，一日看尽长安花。', author: '孟郊', title: '登科后' },
  { content: '沉舟侧畔千帆过，病树前头万木春。', author: '刘禹锡', title: '酬乐天扬州初逢席上见赠' },
  { content: '山重水复疑无路，柳暗花明又一村。', author: '陆游', title: '游山西村' },
  { content: '纸上得来终觉浅，绝知此事要躬行。', author: '陆游', title: '冬夜读书示子聿' },
  { content: '问渠那得清如许？为有源头活水来。', author: '朱熹', title: '观书有感' },
  { content: '不畏浮云遮望眼，自缘身在最高层。', author: '王安石', title: '登飞来峰' },
];

// Unsplash 壁纸 API (使用免费的 picsum)
export const UNSPLASH_API = 'https://picsum.photos/1920/1080';

// 存储键名
export const STORAGE_KEY = 'newtab';

// Bing 每日壁纸 API
export const BING_WALLPAPER_API = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1';

// 默认 Favicon 获取 URL
export const FAVICON_API = 'https://www.google.com/s2/favicons?domain=';

// 默认快捷方式分组（只保留一个默认分组，用户自行添加）
export const DEFAULT_GROUPS: ShortcutGroup[] = [
  { id: 'home', name: '首页', icon: 'Home', position: 0 },
];

// 可用的分组图标
export const GROUP_ICONS = [
  'Home', 'Briefcase', 'GraduationCap', 'Gamepad2', 'Wrench',
  'Code', 'Music', 'Film', 'ShoppingCart', 'Heart',
  'Star', 'Bookmark', 'Folder', 'Globe', 'Zap',
];
