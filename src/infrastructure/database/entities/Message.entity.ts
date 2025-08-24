import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './User.entity';

@Entity('messages')
export class MessageEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  senderId!: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'senderId' })
  sender!: UserEntity;

  @Column()
  receiverId!: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'receiverId' })
  receiver!: UserEntity;

  @Column('text')
  content!: string;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ default: false })
  isFlagged!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}