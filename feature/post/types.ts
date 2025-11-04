import { ApiResult } from '@/types/http';

export type PostStatus = 'ACTIVE' | 'HIDDEN' | 'DELETED';

// PostListItemResponse
export type PostListItemResponse = {
  id: number;
  title: string;
  region: string | null;
  status: PostStatus;
  likeCount: number;
  viewCount: number;
  createdAt: string;
  authorId: number | null;
  authorNickname: string | null;
};

// PostResponse
export type PostResponse = {
  id: number;
  title: string;
  content: string;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  tags: string[];
  likeCount: number;
  viewCount: number;
  status: PostStatus;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  authorId: number | null;
  authorNickname: string | null;
};

// PostCreateRequest
export type PostCreateRequest = {
  title: string;
  content: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
};

// PostUpdateRequest
export type PostUpdateRequest = {
  title?: string;
  content?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
};
