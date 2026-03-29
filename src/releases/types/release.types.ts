import type { Prisma } from '@database/generated/client';
import type { Project } from '@projects/types/project.types';

const releaseWithProjectInclude = { project: true } satisfies Prisma.ReleaseInclude;

export const releaseRecentWithProjectInclude = {
  project: {
    include: {
      projectTags: { include: { tag: true } },
    },
  },
} satisfies Prisma.ReleaseInclude;

export type Release = Prisma.ReleaseGetPayload<{ include: typeof releaseWithProjectInclude }>;

export type ReleaseRecentFromDb = Prisma.ReleaseGetPayload<{ include: typeof releaseRecentWithProjectInclude }>;

export type ReleaseWithProjectEnvironments = Omit<Release, 'project'> & {
  project: Project;
};

export function mapRecentReleaseFromDb(row: ReleaseRecentFromDb): ReleaseWithProjectEnvironments {
  const { projectTags, ...projectRest } = row.project;
  return {
    ...row,
    project: {
      ...projectRest,
      tags: projectTags.map((pt) => pt.tag),
    },
  };
}

export { releaseWithProjectInclude };
