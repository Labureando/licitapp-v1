import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('scraping_logs')
export class ScrapingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  source: string;

  @Column()
  status: string; // SUCCESS, PARTIAL, ERROR

  @Column({ default: 0 })
  itemsNew: number;

  @Column({ default: 0 })
  itemsUpdated: number;

  @Column({ default: 0 })
  itemsErrors: number;

  @Column({ nullable: true })
  duration: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column()
  @Index()
  startedAt: Date;

  @Column({ nullable: true })
  finishedAt: Date;
}