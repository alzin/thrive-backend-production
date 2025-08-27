import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  JoinColumn, 
  ManyToOne, 
  PrimaryColumn, 
  UpdateDateColumn 
} from "typeorm";
import { UserEntity } from "./User.entity";
import { VideoType } from "../../../domain/entities/Video";

@Entity('video')
export class VideoEntity {
  @PrimaryColumn()
  id!: string;

  // @Column()
  // title!: string;

  @Column('text')
  description!: string;

  @Column()
  videoUrl!: string;

  @Column({
    type: 'enum',
    enum: VideoType,
    default: VideoType.YOUTUBE
  })
  videoType!: VideoType;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column({ nullable: true })
  duration?: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column()
  createdBy!: string;

  @ManyToOne(() => UserEntity, {
    onDelete: "CASCADE",
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: "createdBy" })
  creator!: UserEntity;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}