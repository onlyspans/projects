import type { Prisma } from '@database/generated/client';

const releaseWithProjectInclude = { project: true } satisfies Prisma.ReleaseInclude;

export type Release = Prisma.ReleaseGetPayload<{ include: typeof releaseWithProjectInclude }>;

export { releaseWithProjectInclude };
