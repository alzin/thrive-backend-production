export interface IMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  isFlagged: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Message implements IMessage {
  constructor(
    public id: string,
    public senderId: string,
    public receiverId: string,
    public content: string,
    public isRead: boolean,
    public isFlagged: boolean,
    public createdAt: Date,
    public updatedAt: Date
  ) {}

  markAsRead(): void {
    this.isRead = true;
  }

  flag(): void {
    this.isFlagged = true;
  }
}