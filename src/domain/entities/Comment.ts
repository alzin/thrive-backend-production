export interface IAuthor {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  level: number;
}

export interface IComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
  author: IAuthor;
  replies?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export class Comment implements IComment {
  constructor(
    public id: string,
    public postId: string,
    public userId: string,
    public content: string,
    public parentCommentId: string | undefined,
    public author: IAuthor,
    public createdAt: Date,
    public updatedAt: Date,
    public replies?: Comment[]
  ) { }
}