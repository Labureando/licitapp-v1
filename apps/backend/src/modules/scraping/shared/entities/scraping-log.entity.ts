import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('scraping_logs')
export class ScrapingLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  source: string;

  @Column({ type: 'varchar', default: 'PENDING' })
  status: string;

  @Column({ type: 'int', default: 0 })
  itemsNew: number;

  @Column({ type: 'int', default: 0 })
  itemsUpdated: number;

  @Column({ type: 'int', default: 0 })
  itemsErrors: number;

  @Column({ type: 'int', default: 0 })
  duration: number;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
