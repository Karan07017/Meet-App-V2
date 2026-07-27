-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('CREDENTIALS', 'GOOGLE');

-- AlterTable
-- password becomes optional because OAuth (Google) users must never have a
-- stored password of any kind, including the previous shared-secret placeholder.
ALTER TABLE "User"
  ALTER COLUMN "password" DROP NOT NULL,
  ADD COLUMN "provider" "AuthProvider" NOT NULL DEFAULT 'CREDENTIALS',
  ADD COLUMN "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Data migration note:
-- Any existing row whose "password" equals the legacy SECRET_PASS_FOR_GOOGLE
-- value must be manually updated to provider = 'GOOGLE' and password = NULL
-- after this migration runs, since that env var is no longer read by the
-- application and its historical value is not knowable at migration time.
-- Example (run manually, substituting the old secret):
--   UPDATE "User" SET "provider" = 'GOOGLE', "password" = NULL
--   WHERE "password" = '<old SECRET_PASS_FOR_GOOGLE value>';