export interface IAuthor {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  level: number;
}

export interface IFeedback {
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

export class Feedback implements IFeedback {
  constructor(
    public id: string,
    public content: string,
    public mediaUrls: string[],
    public likesCount: number,
    public author: IAuthor,
    public isLiked: boolean,
    public commentsCount: number,
    public createdAt: Date,
    public updatedAt: Date,
  ) { }

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