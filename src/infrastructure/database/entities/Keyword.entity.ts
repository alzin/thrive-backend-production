import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { LessonEntity } from './Lesson.entity';

@Entity('keywords')
export class KeywordEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  lessonId!: string;

  @ManyToOne(() => LessonEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'lessonId' })
  lesson!: LessonEntity;

  @Column()
  englishText!: string;

  @Column()
  japaneseText!: string;

  @Column({ type: 'varchar', nullable: true })
  englishSentence!: string | null;

  @Column({ type: 'varchar', nullable: true })
  japaneseSentence!: string | null;

  @Column({ type: 'varchar', nullable: true })
  englishAudioUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  japaneseAudioUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  japaneseSentenceAudioUrl!: string | null;

  @Column()
  order!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}