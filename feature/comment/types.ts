export type CommentStatus = 'ACTIVE' | 'DELETED';

export type CommentResponse = {
  id: number;
  parentId: number | null;
  depth: number;
  content: string;
  likeCount: number;
  status: CommentStatus;
  createdAt: string;
  authorId: number | null;
  authorNickname: string | null;
  replies: CommentResponse[];
};

export type CommentCreateRequest = {
  content: string;
};

export type CommentUpdateRequest = {
  content: string;
};

export type CommentLikeToggleResponse = {
  commentId: number;
  likeCount: number;
  liked: boolean;
};
