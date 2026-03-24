#!/bin/sh
set -e
bun run prisma:migrate:deploy
exec "$@"
