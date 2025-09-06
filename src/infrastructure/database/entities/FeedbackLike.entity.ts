import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { UserEntity } from "./User.entity";
import { FeedbackEntity } from "./Feedback.entity";

@Entity('feedback_likes')
export class FeedbackLikesEntity {
  @PrimaryColumn()
  id!: string

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column()
  feedbackId!: string

  @ManyToOne(() => FeedbackEntity, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  })
  @JoinColumn({ name: "feedbackId" })
  feedback!: FeedbackEntity

  @CreateDateColumn()
  createdAt!: Date
}