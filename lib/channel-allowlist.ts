import { prisma, slackApp } from "../app";
import { queueChannel } from "./constants";
import { sendDM } from "./utils";

export async function checkIfAllowlisted(channelId: string) {
  const channel = await prisma.slackChannels.findFirst({
    where: {
      id: channelId
    }
  })

  return channel?.allowlisted || false
}

export async function addChannelToAllowlist(channelId: string, admin: string) {
  // look up the channel first
  const channelInfo = await slackApp.client.conversations.info({
    channel: channelId
  })

  // Stop here if the channel does not exist
  if (channelInfo.ok === false) {
    await sendDM(admin, `Channel <#${channelId}> does not exist.`)
    return;
  }

  // Stop here if the channel is private or in a DM.
  if (channelInfo.channel.is_private === true || channelInfo.channel.is_im === true) {
    await sendDM(admin, `Channel <#${channelId}> is private or in a DM.`)
    return;
  }

  let data = await prisma.slackChannels.findFirst({
    where: {
      id: channelId
    }
  })
  
  if (data === null || data.allowlisted === false) {
    await prisma.slackChannels.upsert({
      where: {
        id: channelId
      },
      create: {
        id: channelId,
        allowlisted: true
      },
      update: {
        allowlisted: true
      }
    })

    await slackApp.client.chat.postMessage({
      channel: queueChannel,
      text: `Channel <#${channelId}> has been allowlisted by <@${admin}>`
    })
  } else if (data.allowlisted === true) {
    await sendDM(admin, `Channel <#${channelId}> is already allowlisted.`)
  }
}

export async function removeChannelFromAllowlist(channelId: string, admin: string) {
  // look up the channel first
  const channelInfo = await slackApp.client.conversations.info({
    channel: channelId
  })

  // Stop here if the channel does not exist
  if (channelInfo.ok === false) {
    await sendDM(admin, `Channel <#${channelId}> does not exist.`)
    return;
  }

  let data = await prisma.slackChannels.findFirst({
    where: {
      id: channelId
    }
  })

  if (data.allowlisted === true) {
    await prisma.slackChannels.update({
      where: {
        id: channelId
      },
      data: {
        allowlisted: false
      }
    })

    await slackApp.client.chat.postMessage({
      channel: queueChannel,
      text: `Channel <#${channelId}> has been removed from allowlist by <@${admin}>`
    })
  } else if (data.allowlisted === false) {
    await sendDM(admin, `Channel <#${channelId}> is already blocklisted.`)
  }
}