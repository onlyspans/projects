/**
 * TypeScript interface for Release Structure
 * Matches the ReleaseStructure message in projects.proto
 */

export interface Process {
  id: string;
  name: string;
  config: Record<string, string>;
}

export interface Asset {
  id: string;
  name: string;
  url: string;
  metadata: Record<string, string>;
}

export interface ReleaseConfig {
  processes: Process[];
  variables: Record<string, string>;
  assets: Asset[];
}

export interface ReleaseStructure {
  projectId: string;
  projectName: string;
  version: string;
  snapshotId: string;
  config: ReleaseConfig;
  metadata: Record<string, string>;
}
