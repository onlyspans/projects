import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Release } from '../../releases/entities/release.entity';

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Entity('projects')
@Index(['companyId', 'deletedAt'])
@Index(['slug', 'deletedAt'])
@Index(['targetId', 'deletedAt'])
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  @Column({ type: 'uuid', name: 'target_id', nullable: true })
  targetId: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => Release, (release) => release.project)
  releases: Release[];
}
