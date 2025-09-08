import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { UserEntity } from "./User.entity";

@Entity("feedbacks")
export class FeedbackEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  }) @JoinColumn({ name: "userId" })
  user!: UserEntity;

  @Column("text")
  content!: string;

  @Column({ default: '' })
  mediaUrls!: string;

  @Column({ default: 0 })
  likesCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}