-- CreateTable
CREATE TABLE "SlackLeeks" (
    "message_id" TEXT NOT NULL,
    "message_author" TEXT NOT NULL,
    "first_flagged_by" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'under_review',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlackLeeks_pkey" PRIMARY KEY ("message_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SlackLeeks_message_id_key" ON "SlackLeeks"("message_id");
