/*
  Warnings:

  - You are about to drop the column `message_author` on the `SlackLeeks` table. All the data in the column will be lost.
  - Added the required column `channel_id` to the `SlackLeeks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SlackLeeks" DROP COLUMN "message_author",
ADD COLUMN     "channel_id" TEXT NOT NULL,
ADD COLUMN     "leeksFlagCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "leeksReact" INTEGER NOT NULL DEFAULT 0;
