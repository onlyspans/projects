import type { Environment, Prisma, Project as PrismaProject } from '@database/generated/client';

const releaseWithProjectInclude = { project: true } satisfies Prisma.ReleaseInclude;

export type Release = Prisma.ReleaseGetPayload<{ include: typeof releaseWithProjectInclude }>;

export type ReleaseWithProjectEnvironments = Omit<Release, 'project'> & {
  project: PrismaProject & { environments?: Environment[] };
};

export { releaseWithProjectInclude };
