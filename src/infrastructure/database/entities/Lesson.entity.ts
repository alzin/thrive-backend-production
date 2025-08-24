// backend/src/infrastructure/database/entities/Lesson.entity.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CourseEntity } from './Course.entity';
import { LessonType } from '../../../domain/entities/Lesson';

@Entity('lessons')
export class LessonEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  courseId!: string;

  @ManyToOne(() => CourseEntity, course => course.lessons, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'courseId' })
  course!: CourseEntity;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column()
  order!: number;

  @Column({
    type: 'enum',
    enum: LessonType,
    default: LessonType.VIDEO
  })
  lessonType!: LessonType;

  @Column({ type: 'varchar', nullable: true })
  contentUrl!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  contentData!: any | null;

  @Column({ type: 'text' })
  audioFiles!: string;

  @Column({ type: 'text' })
  resources!: string;

  @Column({ default: false })
  requiresReflection!: boolean;

  @Column({ default: 0 })
  pointsReward!: number;

  @Column({ type: 'int', nullable: true })
  passingScore!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}