import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TicketEntity } from './ticket.entity';

export enum ListingStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('listings')
export class ListingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_id' })
  ticketId: string;

  @ManyToOne(() => TicketEntity)
  @JoinColumn({ name: 'ticket_id' })
  ticket: TicketEntity;

  @Column({ name: 'seller_address' })
  sellerAddress: string;

  @Column({ type: 'decimal', precision: 18, scale: 0 })
  price: number;

  @Column({
    type: process.env.ENABLE_IN_MEMORY_DB === 'true' ? 'simple-enum' : 'enum',
    enum: ListingStatus,
    default: ListingStatus.ACTIVE,
  })
  status: ListingStatus;

  @Column({ name: 'transaction_hash', nullable: true })
  transactionHash: string;

  @CreateDateColumn({
    name: 'created_at',
    type: process.env.ENABLE_IN_MEMORY_DB === 'true' ? 'datetime' : 'timestamp'
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: process.env.ENABLE_IN_MEMORY_DB === 'true' ? 'datetime' : 'timestamp'
  })
  updatedAt: Date;
}
