export type AdminUserStatus = 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'DELETED';

export type AdminUserListItem = {
  id: number;
  email: string;
  nickname: string;
  role: 'USER' | 'ADMIN';
  status: AdminUserStatus;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserDetail = {
  id: number;
  email: string;
  nickname: string;
  role: 'USER' | 'ADMIN';
  status: AdminUserStatus;
  authProvider: string;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUserStatusHistoryItem = {
  id: number;
  userId: number;
  fromStatus: AdminUserStatus;
  toStatus: AdminUserStatus;
  reason: string | null;
  adminUserId: number | null;
  createdAt: string;
};

export type AdminUserStatusUpdateRequest = {
  status: AdminUserStatus;
  reason?: string | null;
};
