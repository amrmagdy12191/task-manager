-- Preserve existing credentials while moving their hashes to the Phase 1 User field.
ALTER TABLE "User" ADD COLUMN "password" TEXT;
UPDATE "User" AS u SET "password" = p."passwordHash"
FROM "Profile" AS p WHERE p."userId" = u."id";
ALTER TABLE "Profile" DROP COLUMN "passwordHash";
ALTER TABLE "Profile" ADD COLUMN "avatarColorIndex" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_avatarColorIndex_check"
CHECK ("avatarColorIndex" BETWEEN 0 AND 7);
