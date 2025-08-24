import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { UserEntity } from "./User.entity";

@Entity('comment')
export class CommentEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  postId!: string; // This now correctly holds either a post ID or an announcement ID

  @Column()
  userId!: string

  @ManyToOne(() => UserEntity, {
    onDelete: "CASCADE",
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: "userId" })
  user!: UserEntity

  @Column()
  content!: string;

  @Column({ nullable: true })
  parentCommentId?: string;

  @ManyToOne(() => CommentEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment?: CommentEntity;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}