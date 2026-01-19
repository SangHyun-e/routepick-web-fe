export type PostStatus = 'ACTIVE' | 'HIDDEN' | 'DELETED';

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
  isLikedByCurrentUser: boolean | null;
};

export type PaginatedResponse<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
  numberOfElements?: number;
  empty?: boolean;
};

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
  isLikedByCurrentUser: boolean | null;
};

export type PostCreateRequest = {
  title: string;
  content: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
};

export type PostUpdateRequest = {
  title?: string;
  content?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
};

export type PostFormDraft = {
  title: string;
  content: string;
  region: string;
  latitude: string;
  longitude: string;
  tagsText: string;
};

export type PostFormErrors = Partial<Record<keyof PostFormDraft, string>> & {
  form?: string;
};

// 정렬 옵션 타입
export type PostSortOption = 'latest' | 'popular' | 'views';

// 좋아요 응답 타입
export type LikeResponse = {
  likeCount: number;
};
