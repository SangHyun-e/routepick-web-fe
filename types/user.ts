export type Me = {
  id: number;
  email: string;
  nickname?: string;
  authProvider?: 'LOCAL' | 'KAKAO';
  profileComplete?: boolean;
  role?: 'USER' | 'ADMIN';
  status?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
};
