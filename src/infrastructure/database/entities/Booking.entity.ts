import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './User.entity';
import { SessionEntity } from './Session.entity';

@Entity('bookings')
export class BookingEntity {
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
  sessionId!: string;

  @ManyToOne(() => SessionEntity, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })

  @JoinColumn({ name: 'sessionId' })
  session!: SessionEntity;

  @Column({
    type: 'enum',
    enum: ['CONFIRMED', 'CANCELLED', 'COMPLETED'],
    default: 'CONFIRMED'
  })
  status!: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
