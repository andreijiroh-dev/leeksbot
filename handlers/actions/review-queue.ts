import { AllMiddlewareArgs, BlockAction, BlockButtonAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import { prisma } from '../../app';
import { detectEnvForChannel } from '../../lib/env';
import { botAdmins } from '../../lib/constants';

export const reviewQueuehandler = async ({ ack, client, body }:
  AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockButtonAction>) => {
  const { user, actions, channel } = body
  const { id: botAdminId } = user
  const { value, action_id } = actions[0]

  if (!botAdmins.includes(botAdminId)) {
    await client.chat.postEphemeral({
      channel: channel.id,
      user: botAdminId,
      text: `You are not authorized to do this action. Please ping a Leeks Bot admin for assistance.`
    })

    return;
  }

  let entry = await prisma.slackLeeks.findFirst({
    where: {
      message_id: value
    }
  })

  // get permalink and user info first
  const {permalink} = await client.chat.getPermalink({
    channel: entry.channel_id,
    message_ts: entry.message_id
  })
  const { channel: imChannelData } = await client.conversations.open({
    users: entry.first_flagged_by
  })

  if (action_id == "approve_leek") {
    console.log(`[review-queue] approving ${entry.message_id} by ${botAdminId}`)
    const posted = await client.chat.postMessage({
      channel: detectEnvForChannel(),
      text: `:eyes: :leek: *Leek ahead*: ${permalink}`,
      mrkdwn: true
    })

    entry = await prisma.slackLeeks.update({
      where: {
        message_id: entry.message_id,
      },
      data: {
        status: "approved",
        leeks_channel_post_id: posted.ts
      }
    })

    await client.chat.postMessage({
      channel: imChannelData.id,
      text: `Hey <@${entry.first_flagged_by}>! Thanks for finding that real leek and is now approved by <@${botAdminId}>, check it now at <#${detectEnvForChannel()}>.`
    })
  }
}