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
  Check,
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

export enum ReleaseEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

@Entity('releases')
@Check(
  `status IN ('draft', 'created', 'scheduled', 'delivering', 'delivered', 'deployed', 'failed', 'rolled_back', 'cancelled')`,
)
@Index(['projectId', 'deletedAt'])
@Index(['status', 'deletedAt'])
@Index(['snapshotId', 'deletedAt'])
@Index(['environment', 'deletedAt'])
@Index(['projectId', 'version'], { unique: true, where: 'deleted_at IS NULL' })
export class Release {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  @Index()
  projectId: string;

  @ManyToOne(() => Project, (project) => project.releases, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'varchar', length: 50 })
  version: string;

  @Column({ type: 'uuid', name: 'snapshot_id', nullable: true })
  snapshotId: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: ReleaseStatus.DRAFT,
  })
  status: ReleaseStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: ReleaseEnvironment.DEVELOPMENT,
  })
  environment: ReleaseEnvironment;

  @Column({ type: 'timestamptz', name: 'scheduled_at', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'timestamptz', name: 'released_at', nullable: true })
  releasedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'deployed_at', nullable: true })
  deployedAt: Date | null;

  @Column({ type: 'timestamptz', name: 'rollback_at', nullable: true })
  rollbackAt: Date | null;

  @Column({ type: 'text', nullable: true })
  changelog: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'text', nullable: true })
  tags: string | null; // JSON array of tags

  @Column({ type: 'jsonb', default: {} })
  structure: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
