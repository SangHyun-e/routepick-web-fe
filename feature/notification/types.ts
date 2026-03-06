export type NotificationType =
  | 'COMMENT'
  | 'REPLY'
  | 'MENTION'
  | 'POST_LIKE'
  | 'POST_SCRAP'
  | 'COURSE_READY'
  | 'PASSWORD_CHANGED'
  | 'LOGIN_ALERT'
  | 'NOTICE_PUBLISHED'
  | 'USER_STATUS_CHANGED'
  | 'ADMIN_NICKNAME_CHANGED';

export type NotificationResourceType = 'POST' | 'COURSE' | 'ACCOUNT' | 'NOTICE' | 'ADMIN';

export type NotificationResponse = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  resourceType: NotificationResourceType | null;
  resourceId: number | null;
  actorId: number | null;
  actorNickname: string | null;
  reason: string | null;
};
