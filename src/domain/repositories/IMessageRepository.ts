import { Message } from '../entities/Message';

export interface IMessageRepository {
  create(message: Message): Promise<Message>;
  findById(id: string): Promise<Message | null>;
  findConversation(userId1: string, userId2: string): Promise<Message[]>;
  findByReceiverId(receiverId: string): Promise<Message[]>;
  findFlagged(): Promise<Message[]>;
  update(message: Message): Promise<Message>;
  delete(id: string): Promise<boolean>;
  markAsRead(id: string): Promise<Message | null>;
  flagMessage(id: string): Promise<Message | null>;
}