import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('events')
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: process.env.ENABLE_IN_MEMORY_DB === 'true' ? 'datetime' : 'timestamp'
  })
  date: Date;

  @Column({ length: 200 })
  venue: string;

  @Column()
  capacity: number;

  @Column({ default: 0 })
  soldCount: number;

  @Column()
  royaltyBps: number;

  @Column()
  maxResalePriceBps: number;

  @Column({ nullable: true })
  artistAddress: string;

  @Column({ length: 42 })
  contractAddress: string;

  @Column()
  chainEventId: number;

  @Column({
    type: 'simple-enum',
    enum: ['pending', 'active', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: {
    description?: string;
    imageUrl?: string;
    category?: string;
  };

  @CreateDateColumn({
    type: process.env.ENABLE_IN_MEMORY_DB === 'true' ? 'datetime' : 'timestamp'
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: process.env.ENABLE_IN_MEMORY_DB === 'true' ? 'datetime' : 'timestamp'
  })
  updatedAt: Date;
}
