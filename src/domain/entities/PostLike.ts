export interface IPostLike {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

export class PostLike implements IPostLike {
  constructor(
    public id: string,
    public userId: string,
    public postId: string,
    public createdAt: Date
  ) {}
}