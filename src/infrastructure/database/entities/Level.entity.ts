import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { CourseEntity } from './Course.entity';

@Entity('levels')
export class LevelEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', default: '' })
  description!: string;

  @OneToMany(() => CourseEntity, course => course.level)
  courses!: CourseEntity[];

  @CreateDateColumn()
  createdAt!: Date;
}
