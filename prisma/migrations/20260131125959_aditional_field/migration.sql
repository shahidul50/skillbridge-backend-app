-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isActive" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'STUDENT';
