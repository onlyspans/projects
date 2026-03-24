import type { PrismaClient, Tag } from '../generated/client';
import { serializeEnvironmentIds } from '../environment-ids';
import { ProjectStatus } from '@projects/constants/project-status';

export async function runSeed(db: PrismaClient): Promise<void> {
  const existing = await db.project.count();
  if (existing > 0) {
    return;
  }

  const tags = await seedTags(db);
  const envByName = await resolveEnvironmentsByName(db);
  await seedProjects(db, tags, envByName);
  await seedReleases(db);

  console.log('🌱 Database seeded with sample data');
}

async function resolveEnvironmentsByName(db: PrismaClient): Promise<Record<string, string>> {
  const envs = await db.environment.findMany({ orderBy: { position: 'asc' } });
  const map: Record<string, string> = {};
  for (const e of envs) {
    map[e.name] = e.id;
  }
  const required = ['development', 'staging', 'production'];
  for (const name of required) {
    if (!map[name]) {
      throw new Error(
        `Seeding requires environments from migrations (missing "${name}"). Run prisma migrate deploy before seeding.`,
      );
    }
  }
  return map;
}

async function seedTags(db: PrismaClient): Promise<Tag[]> {
  const data = [
    { name: 'web', description: 'Web applications', color: '#3b82f6' },
    { name: 'mobile', description: 'Mobile apps', color: '#22c55e' },
    { name: 'api', description: 'Backend APIs', color: '#8b5cf6' },
    { name: 'demo', description: 'Demo / sample projects', color: '#f59e0b' },
  ];
  const tags: Tag[] = [];
  for (const row of data) {
    tags.push(await db.tag.create({ data: row }));
  }
  return tags;
}

async function seedProjects(db: PrismaClient, tags: Tag[], envByName: Record<string, string>) {
  const [tagWeb, tagMobile, tagApi, tagDemo] = tags;

  const rows = [
    {
      name: 'Sample Web App',
      slug: 'sample-web-app',
      description: 'Example web application for development',
      status: ProjectStatus.ACTIVE,
      ownerId: null as string | null,
      environmentIds: serializeEnvironmentIds([envByName['development'], envByName['staging']]),
      metadata: {},
      tagLinks: [{ tagId: tagWeb.id }, { tagId: tagDemo.id }],
    },
    {
      name: 'Mobile SDK',
      slug: 'mobile-sdk',
      description: 'Mobile SDK and tooling',
      status: ProjectStatus.ACTIVE,
      ownerId: null as string | null,
      environmentIds: serializeEnvironmentIds([envByName['development']]),
      metadata: {},
      tagLinks: [{ tagId: tagMobile.id }, { tagId: tagApi.id }],
    },
    {
      name: 'Public API',
      slug: 'public-api',
      description: 'Public REST and gRPC API',
      status: ProjectStatus.ACTIVE,
      ownerId: null as string | null,
      environmentIds: serializeEnvironmentIds([envByName['staging'], envByName['production']]),
      metadata: {},
      tagLinks: [{ tagId: tagApi.id }],
    },
  ];

  for (const row of rows) {
    const { tagLinks, ...projectData } = row;
    await db.project.create({
      data: {
        ...projectData,
        projectTags: { create: tagLinks },
      },
    });
  }
}

async function seedReleases(db: PrismaClient) {
  const projects = await db.project.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
    take: 2,
  });
  const [project1, project2] = projects;
  if (!project1 || !project2) {
    return;
  }

  const data = [
    {
      projectId: project1.id,
      version: '1.0.0',
      snapshotId: null,
      changelog: 'Initial release',
      notes: null,
      structure: {},
      metadata: {},
    },
    {
      projectId: project1.id,
      version: '1.1.0',
      snapshotId: null,
      changelog: null,
      notes: 'WIP',
      structure: {},
      metadata: {},
    },
    {
      projectId: project2.id,
      version: '0.1.0',
      snapshotId: null,
      changelog: 'Alpha release',
      notes: null,
      structure: {},
      metadata: {},
    },
  ];

  await db.release.createMany({ data });
}
