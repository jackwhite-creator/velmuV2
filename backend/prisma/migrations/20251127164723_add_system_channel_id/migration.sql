-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('DEFAULT', 'SYSTEM');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'DEFAULT';

-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "systemChannelId" TEXT;

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_systemChannelId_fkey" FOREIGN KEY ("systemChannelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
