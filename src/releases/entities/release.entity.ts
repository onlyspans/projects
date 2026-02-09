import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export enum ReleaseStatus {
  DRAFT = 'draft',
  CREATED = 'created',
  SCHEDULED = 'scheduled',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
  DEPLOYED = 'deployed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
  CANCELLED = 'cancelled',
}

@Entity('releases')
@Index(['projectId'], { where: 'deleted_at IS NULL' })
@Index(['status'], { where: 'deleted_at IS NULL' })
@Index(['snapshotId'], { where: 'deleted_at IS NULL' })
@Index(['projectId', 'version'], { unique: true, where: 'deleted_at IS NULL' })
export class Release {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.releases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'varchar', length: 50 })
  version: string;

  @Column({ type: 'uuid', name: 'snapshot_id', nullable: true })
  snapshotId: string | null;

  @Column({
    type: 'enum',
    enum: ReleaseStatus,
    default: ReleaseStatus.DRAFT,
  })
  status: ReleaseStatus;

  @Column({ type: 'text', nullable: true })
  changelog: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'jsonb', default: {} })
  structure: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
