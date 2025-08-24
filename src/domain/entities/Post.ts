export interface IAuthor {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  level: number;
}

export interface IPost {
  id: string;
  content: string;
  mediaUrls: string[];
  likesCount: number;
  author: IAuthor;
  isLiked: boolean;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Post implements IPost {
  constructor(
    public id: string,
    public author: IAuthor,
    public content: string,
    public mediaUrls: string[],
    public likesCount: number,
    public isLiked: boolean,
    public createdAt: Date,
    public updatedAt: Date,
    public commentsCount: number = 0
  ) {}

  incrementLikes(): void {
    this.likesCount++;
  }

  decrementLikes(): void {
    this.likesCount = Math.max(0, this.likesCount - 1);
  }

  toggleLike(): void {
    if (this.isLiked) {
      this.decrementLikes();
    } else {
      this.incrementLikes();
    }
    this.isLiked = !this.isLiked;
  }

  // Add methods for comments count
  incrementCommentsCount(): void {
    this.commentsCount++;
  }

  decrementCommentsCount(): void {
    this.commentsCount = Math.max(0, this.commentsCount - 1);
  }
}