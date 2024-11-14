import { AllMiddlewareArgs, BlockAction, BlockButtonAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import { logOps, prisma } from '../../app';
import { detectEnvForChannel } from '../../lib/env';
import { botAdmins, queueChannel } from '../../lib/constants';
import { generateReviewQueueMessage, permissionDenied } from '../../lib/blocks';
import { ActionsSection, Blocks, ButtonAction, ContextSection, MarkdownText, PlainText, TextSection } from '../../lib/block-builder';
import { sendDM } from '../../lib/utils';

export const reviewQueueHandler = async ({ ack, client, body }:
  AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockButtonAction>) => {
  logOps.debug(`review-queue`, `received event data:`, JSON.stringify(body))
  const { user, actions, channel, message } = body
  const { id: botAdminId } = user
  const { value, action_id } = actions[0]

  // ack it first before doing any other processing
  await ack()

  if (!botAdmins.includes(botAdminId)) {
    await client.chat.postEphemeral({
      channel: channel.id,
      user: botAdminId,
      blocks: permissionDenied
    })

    return;
  }

  let entry = await prisma.slackLeeks.findFirst({
    where: {
      message_id: value
    }
  })

  // get permalink of original message
  const { permalink } = await client.chat.getPermalink({
    channel: entry.channel_id,
    message_ts: entry.message_id
  })

  // get conversation ID for a user on DMs
  const { channel: imChannelData } = await client.conversations.open({
    users: entry.first_flagged_by
  })

  // todo: handle block updates on approval/denial
  if (action_id == "approve_leek") {
    logOps.info(`review-queue:${entry.message_id}`, `posting to channel ${detectEnvForChannel()}, approved by ${botAdminId}`)
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
      channel: queueChannel,
      thread_ts: entry.review_queue_id,
      text: `:white_check_mark: Approved by <@${botAdminId}>`,
      //username: "leeksbot audit logs"
    })

    await client.chat.postMessage({
      channel: imChannelData.id,
      text: `Hey <@${entry.first_flagged_by}>! Thanks for finding that real leek and is now approved by <@${botAdminId}>, check it now at <#${detectEnvForChannel()}>.`
    })

    await client.chat.update({
      channel: queueChannel,
      ts: entry.review_queue_id,
      blocks: [
        message.blocks[0],
        message.blocks[1],
        message.blocks[2],
        message.blocks[3],
        new ActionsSection([
          new ButtonAction(
            new PlainText(":leftwards_arrow_with_hook: Undo approval and delete", true),
            entry.message_id,
            "delete")
        ]).render(),
        new ContextSection([
          new MarkdownText(`Original message ID on database: \`${entry.message_id}\``)
        ]).render()
      ]
    })

  } else if (action_id == "deny_leek") {
    logOps.info(`review-queue:${entry.message_id}`, `denying from queue by ${botAdminId}`)
    entry = await prisma.slackLeeks.update({
      where: {
        message_id: entry.message_id,
      },
      data: {
        status: "denied"
      }
    })

    await client.chat.postMessage({
      channel: imChannelData.id,
      text: `Hey <@${entry.first_flagged_by}>! Your leek flag was denied by <@${botAdminId}>. If you have questions, please reach out to the review queue team if you have questions.`
    })

    await client.chat.postMessage({
      channel: queueChannel,
      thread_ts: entry.review_queue_id,
      text: `:x: Denied by <@${botAdminId}>`,
      //username: "leeksbot audit logs"
    })

    await client.chat.update({
      channel: queueChannel,
      ts: entry.review_queue_id,
      blocks: [
        message.blocks[0],
        message.blocks[1],
        message.blocks[2],
        message.blocks[3],
        new ContextSection([
          new MarkdownText(`Original message ID on database: \`${entry.message_id}\``)
        ]).render()
      ]
    })
  }
}

export const addToQueueHandler = async ({
  ack, client, body
}: AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockButtonAction>) => {
  logOps.debug(`review-queue`, `received event data:`, JSON.stringify(body))
  const { user, actions, channel, message } = body
  const { id: botAdminId } = user
  const { value } = actions[0]

  // ack it first before doing any other processing
  await ack()

  if (!botAdmins.includes(botAdminId)) {
    await client.chat.postEphemeral({
      channel: channel.id,
      user: botAdminId,
      blocks: permissionDenied
    })

    return;
  }

  let entry = await prisma.slackLeeks.findFirst({
    where: {
      message_id: value
    }
  })

  await prisma.slackLeeks.update({
    where: {
      message_id: entry.message_id
    },
    data: {
      status: "pending"
    }
  })

  await client.chat.update({
    channel: queueChannel,
    ts: entry.review_queue_id,
    blocks: await generateReviewQueueMessage(
      entry.message_id,
      entry.channel_id,
      entry.first_flagged_by,
      "requeued"
    )
  })

  await sendDM(entry.first_flagged_by, `Hey there, we have requeued your leek flag (message ID: ${entry.message_id}) for review by an admin. Expect another message here for any updates.`)
}

export const undoApproveLeek = async ({ ack, client, body }:
  AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockButtonAction>) {
  const { user, actions, message, channel } = body;
  const { id: botAdminId } = user
  const { value, } = actions[0]

  // ack it first before doing any other processing
  await ack()

  if (!botAdmins.includes(botAdminId)) {
    await client.chat.postEphemeral({
      channel: channel.id,
      user: botAdminId,
      blocks: permissionDenied
    })

    return;
  }

  let entry = await prisma.slackLeeks.findFirst({
    where: {
      message_id: value
    }
  })
}