export type PostStreamEvent = {
  postId: number;
  title: string;
  authorId: number | null;
  authorNickname: string | null;
  createdAt: string;
};

export type CommentStreamEvent = {
  postId: number;
  commentId: number;
  authorId: number | null;
  authorNickname: string | null;
  createdAt: string;
};
