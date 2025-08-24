import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './User.entity';

@Entity('profiles')
export class ProfileEntity {
  @PrimaryColumn()
  id!: string;

  @Column()
  userId!: string;

  @OneToOne(() => UserEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'userId' }) // Ensure the foreign key is recognized
  user!: UserEntity;

  @Column()
  name!: string;

  @Column({ nullable: true })
  bio!: string;

  @Column({ nullable: true })
  profilePhoto!: string;

  @Column({ nullable: true })
  languageLevel!: string;

  @Column({ default: 0 })
  points!: number;

  @Column('simple-array', { default: '' })
  badges!: string[];

  @Column({ default: 1 })
  level!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
