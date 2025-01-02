-- CreateTable
CREATE TABLE "SlackChannels" (
    "id" TEXT NOT NULL,
    "allowlisted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlackChannels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SlackChannels_id_key" ON "SlackChannels"("id");
