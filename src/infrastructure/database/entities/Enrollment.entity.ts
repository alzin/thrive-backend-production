// backend/src/infrastructure/database/entities/Enrollment.entity.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './User.entity';
import { CourseEntity } from './Course.entity';

@Entity('enrollments')
export class EnrollmentEntity {
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
  courseId!: string;

  @ManyToOne(() => CourseEntity, course => course.lessons, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })

  @JoinColumn({ name: 'courseId' })
  course!: CourseEntity;

  @Column()
  enrolledAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}