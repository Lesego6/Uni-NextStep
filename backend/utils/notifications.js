const db = require("../database");

function cleanText(value, maxLength = 255) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim().slice(0, maxLength);
}

function mapNotification(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    application_id: row.application_id,
    type: row.type,
    title: row.title,
    message: row.message || "",
    link_path: row.link_path || "",
    is_read: Boolean(row.is_read),
    created_at: row.created_at,
    read_at: row.read_at
  };
}

async function createNotification(notification, executor = db) {
  const userId = Number(notification.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  const result = await executor.prepare(`
    INSERT INTO notifications (
      user_id,
      application_id,
      type,
      title,
      message,
      link_path
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    notification.applicationId || null,
    cleanText(notification.type, 80) || "general",
    cleanText(notification.title, 180),
    cleanText(notification.message, 1000) || null,
    cleanText(notification.linkPath) || null
  );

  return result.lastInsertRowid;
}

async function getUserNotifications(userId, { limit = 30 } = {}) {
  const rows = await db.prepare(`
    SELECT *
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT ?
  `).all(userId, limit);

  const unread = await db.prepare(`
    SELECT COUNT(*) AS total
    FROM notifications
    WHERE user_id = ?
      AND is_read = 0
  `).get(userId);

  return {
    notifications: rows.map(mapNotification),
    unread_count: Number(unread?.total || 0)
  };
}

async function markNotificationRead(userId, notificationId) {
  return await db.prepare(`
    UPDATE notifications
    SET is_read = 1,
        read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
    WHERE id = ?
      AND user_id = ?
  `).run(notificationId, userId);
}

async function markAllNotificationsRead(userId) {
  return await db.prepare(`
    UPDATE notifications
    SET is_read = 1,
        read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
    WHERE user_id = ?
      AND is_read = 0
  `).run(userId);
}

module.exports = {
  createNotification,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead
};
