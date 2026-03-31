import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('cpv_codes')
export class CpvCode {
    @PrimaryColumn()
    id: string; // El código CPV: "45000000"

    @Column()
    description: string;

    @Column({ nullable: true, type: 'varchar' })
    parentId: string | null;
    @Column()
    level: number;
}