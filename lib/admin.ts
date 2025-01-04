import { prisma, slackApp } from "../app";
import { Blocks, HeaderSection, MarkdownText, PlainText, TextSection } from "./block-builder";
import { queueChannel } from "./constants";
import { sendDM } from "./utils";

export async function checkIfAdmin(userId: string) {
  const user = await prisma.slackUsers.findFirst({
    where: {
      id: userId
    }
  })

  return user.bot_admin || false
}

export async function addAdmin(userId: string) {
  const result = await prisma.slackUsers.upsert({
    where: {
      id: userId
    },
    create: {
      id: userId,
      bot_admin: true
    },
    update: {
      bot_admin: true,
      is_banned: false,
      banned_at: null,
      banned_by: null,
    }
  })

  return result
}

export async function removeAdmin(userId: string) {
  const result = await prisma.slackUsers.update({
    where: {
      id: userId
    },
    data: {
      bot_admin: false
    }
  })

  return result
}

export async function checkIfUserBanned(userId: string) {
  const user = await prisma.slackUsers.findFirst({
    where: {
      id: userId
    }
  })

  return user.is_banned || false
}

export async function banUser(userId: string, admin: string, reason?: string) {
  const status = (await prisma.slackUsers.findFirst({ where: { id: userId } })).is_banned

  // prepare db data for updating an entry
  const data = {
    is_banned: true,
    banned_at: new Date(),
    banned_by: admin,
    reason: reason || "No reason provided"
  }

  if (status === false) {
    const result = await prisma.slackUsers.update({
      where: {
        id: userId
      },
      data
    })

    // notify user about the ban
    await sendDM(
      userId,
      {
        blocks: new Blocks([
          new HeaderSection(new PlainText("You have been banned from using Leeksbot"), "warning"),
          new TextSection(new MarkdownText(`You have been banned by <@${admin}> for the following reason: ${reason}`)),
          new TextSection(new MarkdownText("If you believe this is a mistake, please contact the admins via DMs or at the #leeksbot-meta channel.")),
        ]).render()
      }
    )
    await slackApp.client.chat.postMessage({
      channel: queueChannel,
      blocks: new Blocks([
        new HeaderSection(new PlainText("Ban notification"), "warning"),
        new TextSection(new MarkdownText(`*User*: <@${userId}>`)),
        new TextSection(new MarkdownText(`*Banned by*: <@${admin}>`)),
        new TextSection(new MarkdownText(`*Reason*: ${reason}`))
      ]).render()
    })

    return result
  }
}

export async function unbanUser(userId: string, admin: string) {
  const status = (await prisma.slackUsers.findFirst({ where: { id: userId } })).is_banned

  if (status === true) {
    const result = await prisma.slackUsers.update({
      where: {
        id: userId
      },
      data: {
        // just set the ban status to false while keeping the
        // last ban data for historical reasons until overwriten
        // by the next ban
        is_banned: false,
      }
    })

    // notify user about the ban
    await sendDM(
      userId,
      {
        blocks: new Blocks([
          new HeaderSection(new PlainText("You have been unbanned from using Leeksbot"), "warning"),
          new TextSection(new MarkdownText(`You have been unbanned by <@${admin}>. You can now use Leeksbot again.`))
        ]).render()
      }
    )

    await slackApp.client.chat.postMessage({
      channel: queueChannel,
      blocks: new Blocks([
        new HeaderSection(new PlainText("Ban notification"), "warning"),
        new TextSection(new MarkdownText(`*User*: <@${userId}>`)),
        new TextSection(new MarkdownText(`*Unbanned by*: <@${admin}>`))
      ]).render()
    })
  }
}