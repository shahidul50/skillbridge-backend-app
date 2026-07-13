/*
  Warnings:

  - You are about to drop the `ContactMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ContactMessage";

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "ContactMessageRole" NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);
