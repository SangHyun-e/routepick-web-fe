import type { AdminUserListItem } from '@/feature/admin/user/types';

export type AdminSignupStat = {
  date: string;
  count: number;
};

export type AdminDashboardResponse = {
  totalUsers: number;
  recentUsers: AdminUserListItem[];
  signupsByDay: AdminSignupStat[];
};
