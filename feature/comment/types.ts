export type CommentStatus = 'ACTIVE' | 'DELETED';
export type CommentDeletedBy = 'USER' | 'ADMIN';

export type CommentResponse = {
  id: number;
  parentId: number | null;
  depth: number;
  content: string;
  likeCount: number;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string | null;
  authorId: number | null;
  authorNickname: string | null;
  replyTargetId?: number | null;
  replyTargetNickname?: string | null;
  replies: CommentResponse[];
  isLikedByCurrentUser?: boolean;
};

export type MyCommentListItem = {
  id: number;
  postId: number;
  postTitle: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string | null;
};

export type AdminCommentListItem = {
  id: number;
  postId: number;
  postTitle: string;
  parentId: number | null;
  depth: number;
  content: string;
  status: CommentStatus;
  deletedBy: CommentDeletedBy;
  createdAt: string;
  updatedAt: string | null;
  authorId: number | null;
  authorNickname: string | null;
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

export type CommentPositionResponse = {
  page: number;
  rootCommentId: number;
};
