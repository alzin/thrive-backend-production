// backend/src/infrastructure/database/entities/Course.entity.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CourseType } from '../../../domain/entities/Course';
import { LessonEntity } from './Lesson.entity';

@Entity('courses')
export class CourseEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column({
    type: 'enum',
    enum: CourseType
  })
  type!: CourseType;

  @Column()
  icon!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  freeLessonCount!: number;

  @Column({ default: 1 }) // NEW FIELD with default order
  order!: number;

  @OneToMany(() => LessonEntity, lesson => lesson.course)
  lessons!: LessonEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}