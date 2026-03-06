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
  nicknameUpdatedAt: string | null;
  nicknameChangeReason: string | null;
  role: 'USER' | 'ADMIN';
  status: AdminUserStatus;
  authProvider: string;
  profileComplete: boolean;
  withdrawReason: string | null;
  rejoinRestrictedUntil: string | null;
  rejoinRestrictionReleasedAt: string | null;
  rejoinRestrictionReleasedBy: number | null;
  rejoinRestrictionReleaseReason: string | null;
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

export type AdminUserNicknameUpdateRequest = {
  nickname: string;
  reason: string;
};
