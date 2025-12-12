/**
 * Favicon 工具函数 - 支持离线缓存
 */

/**
 * 将 Blob 转换为 Base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 压缩图片到指定大小
 * @param blob 原始图片 blob
 * @param maxSizeKB 最大大小（KB）
 * @returns 压缩后的 base64，如果无法压缩则返回 null
 */
async function compressImage(blob: Blob, maxSizeKB: number = 10): Promise<string | null> {
  try {
    // 如果原始图片已经很小，直接返回
    if (blob.size <= maxSizeKB * 1024) {
      return await blobToBase64(blob);
    }

    // 创建图片对象
    const img = new Image();
    const objectUrl = URL.createObjectURL(blob);
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = objectUrl;
    });

    // 创建 canvas 进行压缩
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 保持原始尺寸，但使用较低的质量
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // 尝试不同的质量级别
    let quality = 0.8;
    let base64 = '';
    
    while (quality > 0.1) {
      base64 = canvas.toDataURL('image/jpeg', quality);
      const sizeKB = (base64.length * 3) / 4 / 1024; // 估算 base64 大小
      
      if (sizeKB <= maxSizeKB) {
        break;
      }
      
      quality -= 0.1;
    }

    URL.revokeObjectURL(objectUrl);
    
    // 如果压缩后仍然太大，返回 null
    const finalSizeKB = (base64.length * 3) / 4 / 1024;
    if (finalSizeKB > maxSizeKB * 1.5) {
      console.warn(`Icon too large after compression: ${finalSizeKB.toFixed(2)}KB`);
      return null;
    }
    
    return base64;
  } catch (error) {
    console.error('Failed to compress image:', error);
    return null;
  }
}

/**
 * 下载 favicon 并转换为 base64（带压缩）
 * @param url 网站 URL
 * @param maxSizeKB 最大大小（KB），默认 10KB
 * @returns base64 格式的图标，失败返回 null
 */
export async function downloadFavicon(url: string, maxSizeKB: number = 10): Promise<string | null> {
  try {
    const domain = new URL(url).hostname;
    // 使用较小的尺寸以减少存储空间
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    
    const response = await fetch(faviconUrl);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    
    // 检查是否是有效的图片（大于 100 字节）
    if (blob.size < 100) return null;
    
    // 压缩图片
    const base64 = await compressImage(blob, maxSizeKB);
    return base64;
  } catch (error) {
    console.error('Failed to download favicon:', error);
    return null;
  }
}

/**
 * 获取 favicon URL（优先使用本地 base64，否则使用在线 API）
 * @param shortcut 快捷方式对象
 * @returns favicon URL
 */
export function getFaviconUrl(shortcut: { url: string; favicon?: string; faviconBase64?: string }): string {
  // 1. 优先使用本地 base64
  if (shortcut.faviconBase64) {
    return shortcut.faviconBase64;
  }
  
  // 2. 使用在线 favicon URL
  if (shortcut.favicon) {
    return shortcut.favicon;
  }
  
  // 3. 生成默认的 Google favicon API URL
  try {
    const domain = new URL(shortcut.url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
}

/**
 * 批量下载并缓存 favicon
 * @param shortcuts 快捷方式列表
 * @param onProgress 进度回调
 */
export async function batchDownloadFavicons(
  shortcuts: Array<{ id: string; url: string; favicon?: string; faviconBase64?: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  let current = 0;
  
  for (const shortcut of shortcuts) {
    // 跳过已有 base64 的
    if (shortcut.faviconBase64) {
      current++;
      onProgress?.(current, shortcuts.length);
      continue;
    }
    
    const base64 = await downloadFavicon(shortcut.url);
    if (base64) {
      results.set(shortcut.id, base64);
    }
    
    current++;
    onProgress?.(current, shortcuts.length);
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}
