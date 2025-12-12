/**
 * 置顶书签同步工具
 * 用于在 TMarks 页面操作置顶时通知 NewTab 页面刷新
 */

/**
 * 通知所有 NewTab 页面刷新置顶书签
 * 在 TMarks 页面设置/取消置顶时调用
 */
export async function notifyPinnedBookmarksChanged(): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      type: 'REFRESH_PINNED_BOOKMARKS',
      payload: { timestamp: Date.now() }
    });
    console.log('[PinnedBookmarks] 已通知 NewTab 页面刷新');
  } catch (error) {
    console.error('[PinnedBookmarks] 通知失败:', error);
  }
}
