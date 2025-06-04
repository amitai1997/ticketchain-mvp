import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EventEntity } from '../../events/entities/event.entity';

export enum TicketStatus {
  OWNED = 'owned',
  LISTED = 'listed',
  USED = 'used',
  REVOKED = 'revoked',
}

@Entity('tickets')
export class TicketEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ticket_id', type: 'varchar' })
  ticketId: string;

  @Column({ name: 'event_id' })
  eventId: string;

  @ManyToOne(() => EventEntity)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;

  @Column({ name: 'owner_address' })
  ownerAddress: string;

  @Column({ nullable: true })
  seatNumber: string;

  @Column({
    // Use string type for SQLite compatibility in tests
    type: process.env.NODE_ENV === 'test' ? 'varchar' : 'enum',
    enum: TicketStatus,
    default: TicketStatus.OWNED,
  })
  status: TicketStatus;

  @Column({ name: 'token_id', type: 'varchar', nullable: true })
  tokenId: string;

  @Column({ name: 'token_uri', nullable: true })
  tokenUri: string;

  @Column({
    name: 'minted_at',
    nullable: true,
    // Use datetime type for SQLite compatibility in tests
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp'
  })
  mintedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
