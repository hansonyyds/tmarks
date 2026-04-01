import { generateUUID } from './crypto'

/**
 * 创建或链接标签到书签
 * 自动处理标签的创建、查找和链接
 * 支持恢复软删除的标签
 *
 * @param db - D1 数据库实例
 * @param bookmarkId - 书签 ID
 * @param tagNames - 标签名称数组
 * @param userId - 用户 ID
 */
export async function createOrLinkTags(
  db: D1Database,
  bookmarkId: string,
  tagNames: string[],
  userId: string
): Promise<void> {
  if (!tagNames || tagNames.length === 0) return

  const now = new Date().toISOString()

  // 优化：批量查询所有标签，避免 N+1 查询
  const trimmedNames = tagNames.map(name => name.trim()).filter(name => name.length > 0)
  if (trimmedNames.length === 0) return

  // 去重：使用小写作为唯一键，保留首次出现的原始大小写
  const uniqueNames: string[] = []
  const seenLower = new Set<string>()
  for (const name of trimmedNames) {
    const lower = name.toLowerCase()
    if (!seenLower.has(lower)) {
      seenLower.add(lower)
      uniqueNames.push(name)
    }
  }

  // 构建 IN 查询的占位符
  const placeholders = uniqueNames.map(() => '?').join(',')

  // 查询所有标签（包括软删除的），以便恢复或复用
  const { results: allTags } = await db
    .prepare(`SELECT id, name, deleted_at FROM tags WHERE user_id = ? AND LOWER(name) IN (${placeholders})`)
    .bind(userId, ...uniqueNames.map(name => name.toLowerCase()))
    .all<{ id: string; name: string; deleted_at: string | null }>()

  // 创建标签名称到 ID 的映射（不区分大小写）
  const tagMap = new Map<string, string>()
  const tagsToRestore: string[] = []

  for (const tag of allTags || []) {
    const lowerName = tag.name.toLowerCase()
    if (!tagMap.has(lowerName)) {
      tagMap.set(lowerName, tag.id)

      // 如果标签被软删除，标记为需要恢复
      if (tag.deleted_at) {
        tagsToRestore.push(tag.id)
      }
    }
  }

  // 批量恢复软删除的标签
  if (tagsToRestore.length > 0) {
    const restoreStatements = tagsToRestore.map(tagId =>
      db
        .prepare('UPDATE tags SET deleted_at = NULL, updated_at = ? WHERE id = ?')
        .bind(now, tagId)
    )
    await db.batch(restoreStatements)
    console.log(`[createOrLinkTags] Restored ${tagsToRestore.length} soft-deleted tags`)
  }

  // 找出需要创建的新标签（已去重）
  const tagsToCreate = uniqueNames.filter(name => !tagMap.has(name.toLowerCase()))

  // 批量创建新标签
  if (tagsToCreate.length > 0) {
    // 使用事务批量插入（D1 支持批量操作）
    const insertStatements = tagsToCreate.map(name => {
      const tagId = generateUUID()
      tagMap.set(name.toLowerCase(), tagId)
      // 统一使用小写存储，避免大小写导致的唯一约束冲突
      return db
        .prepare('INSERT INTO tags (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
        .bind(tagId, userId, name.toLowerCase(), now, now)
    })

    // 批量执行插入
    await db.batch(insertStatements)
  }

  // 批量链接标签到书签
  const linkStatements = uniqueNames.map(name => {
    const tagId = tagMap.get(name.toLowerCase())
    if (!tagId) {
      console.error(`[createOrLinkTags] Tag ID not found for: ${name}`)
      return null
    }
    return db
      .prepare('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id, user_id, created_at) VALUES (?, ?, ?, ?)')
      .bind(bookmarkId, tagId, userId, now)
  }).filter(stmt => stmt !== null) as D1PreparedStatement[]

  if (linkStatements.length > 0) {
    await db.batch(linkStatements)
  }
}
