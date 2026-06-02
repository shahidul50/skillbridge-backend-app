-- CreateEnum
CREATE TYPE "PaymentAccountType" AS ENUM ('PERSONAL', 'MERCHANT');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "meetingLink" TEXT;

-- AlterTable
ALTER TABLE "platform_payment_accounts" ADD COLUMN     "accountType" "PaymentAccountType" NOT NULL DEFAULT 'PERSONAL';
