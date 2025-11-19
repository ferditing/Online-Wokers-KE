// frontend/src/services/notifications.service.ts
import api from './api';

export interface Notification {
  _id: string;
  user: string;
  type: 'application_accepted' | 'application_rejected' | 'submission_approved' | 'new_application' | 'submission_received';
  message: string;
  read: boolean;
  relatedId?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getNotifications(limit = 50, unreadOnly = false): Promise<Notification[]> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('unreadOnly', unreadOnly.toString());

  const res = await api.get(`/notifications?${params}`);
  return res.data.notifications || [];
}

export async function markAsRead(notificationId: string): Promise<Notification> {
  const res = await api.patch(`/notifications/${notificationId}/read`);
  return res.data.notification;
}

export async function markAllAsRead(): Promise<{ message: string }> {
  const res = await api.patch('/notifications/read-all');
  return res.data;
}
