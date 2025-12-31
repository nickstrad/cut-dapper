.PHONY: db/migrate
db/migrate:
	npx prisma migrate dev

.PHONY: db/studio
db/studio:
	npx prisma studio

.PHONY: db/reset
db/reset:
	npx prisma migrate reset --force
	npx prisma migrate dev --name init
	npx @better-auth/cli@latest generate
	npx prisma db execute --file prisma/manual_migration_init.sql
	npx tsx prisma/seed.ts

.PHONY: db/generate
db/generate:
	npx prisma generate