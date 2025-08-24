import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { UserEntity } from './User.entity';
import { LessonEntity } from './Lesson.entity';
import { CourseEntity } from './Course.entity';

@Entity('progress')
export class ProgressEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column()
  lessonId!: string;

  @ManyToOne(() => LessonEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'lessonId' })
  lesson!: LessonEntity;

  @Column()
  courseId!: string;

  @ManyToOne(() => CourseEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'courseId' })
  course!: CourseEntity;

  @Column({ default: false })
  isCompleted!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'boolean', nullable: true })
  reflectionSubmitted!: boolean | null;

  @Column({ type: 'float', nullable: true })
  quizScore!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}