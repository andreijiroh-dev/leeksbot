import { PrismaClient } from "@prisma/client";
import { allowlistedChannels, botAdmins } from "../lib/constants";

const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$connect()

    for (const uid of botAdmins) {
      console.log("Migrating Slack bot admin ID to SlackUsers table:", uid)
      const result = await prisma.slackUsers.upsert({
        where: {
          id: uid
        },
        create: {
          id: uid,
          bot_admin: true
        },
        update: {
          bot_admin: true,
          is_banned: false,
          banned_at: null,
          banned_by: null,
        }
      })
      console.log("DB Result:", result)
    }

    for (const channel of allowlistedChannels) {
      console.log("Migrating Slack channel ID to SlackChannels table:", channel)
      const result = await prisma.slackChannels.upsert({
        where: {
          id: channel
        },
        create: {
          id: channel,
          allowlisted: true
        },
        update: {
          allowlisted: true
        }
      })
      console.log("DB Result:", result)
    }
  } catch (error) {
    console.error('Something gone wrong', error);
    await prisma.$disconnect()
  }
})();