export interface Notification {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
}

export interface INotificationService {
  sendNotification(notification: Notification): Promise<void>;
  sendBulkNotifications(notifications: Notification[]): Promise<void>;
  markAsRead(userId: string, notificationId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
}