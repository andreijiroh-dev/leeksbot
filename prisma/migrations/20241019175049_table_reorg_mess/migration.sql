-- AlterTable
ALTER TABLE "SlackLeeks" ADD COLUMN     "review_queue_id" TEXT,
ALTER COLUMN "status" SET DEFAULT 'pending';
