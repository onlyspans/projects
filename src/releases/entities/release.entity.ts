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
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

@Entity('releases')
@Check(`status IN ('draft', 'created', 'delivering', 'delivered', 'failed')`)
@Index(['projectId', 'deletedAt'])
@Index(['status', 'deletedAt'])
@Index(['snapshotId', 'deletedAt'])
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
