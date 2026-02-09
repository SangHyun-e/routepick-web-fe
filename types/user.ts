export type Me = {
  id: number;
  email: string;
  nickname?: string;
  role?: 'USER' | 'ADMIN';
  status?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
};
