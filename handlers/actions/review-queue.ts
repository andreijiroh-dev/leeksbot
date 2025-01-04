import {
  AllMiddlewareArgs,
  BlockButtonAction,
  SlackActionMiddlewareArgs
} from '@slack/bolt';
import { logOps, prisma } from '../../app';
import { detectEnvForChannel, getBaseSlashCommand } from '../../lib/env';
import { botAdmins, queueChannel } from '../../lib/constants';
import { generateReviewQueueMessage, permissionDenied } from '../../lib/blocks';
import {
  ActionsSection,
  Blocks,
  ButtonAction,
  ContextSection,
  MarkdownText,
  PlainText,
  TextSection
} from '../../lib/block-builder';
import { sendDM } from '../../lib/utils';
import { checkIfAdmin } from '../../lib/admin';
import { SlackLeeksStatus, SlackLeekTypes } from '../../lib/types';

export const approveLeekFlag = async ({ ack, client, body }:
  AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockButtonAction>) => {
  logOps.debug(`review-queue`, `received event data:`, JSON.stringify(body))
  const { user, actions, channel, message } = body
  const { id: botAdminId } = user
  const { value } = actions[0]

  // ack it first before doing any other processing
  await ack()

  // check if the user is a bot admin
  if (await checkIfAdmin(botAdminId) == false) {
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
  }) as SlackLeekTypes

  // get permalink of original message
  const { permalink } = await client.chat.getPermalink({
    channel: entry.channel_id,
    message_ts: entry.message_id
  })

  // get conversation ID for a user on DMs
  const { channel: imChannelData } = await client.conversations.open({
    users: entry.first_flagged_by
  })

  logOps.info(`review-queue:${entry.message_id}`, `posting to channel ${detectEnvForChannel()}, approved by ${botAdminId}`)
  const posted = await client.chat.postMessage({
    channel: detectEnvForChannel(),
    text: `:eyes: :leek: *Leek ahead*: ${permalink}`,
    mrkdwn: true
  })

  entry = await prisma.slackLeeks.update({
    where: {
      message_id: entry.message_id
    },
    data: {
      leeks_channel_post_id: posted.ts,
      status: SlackLeeksStatus.Approved as SlackLeeksStatus
    }
  }) as SlackLeekTypes

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
      new TextSection(new MarkdownText(`:white_check_mark: Approved by <@${botAdminId}>`)).render(),
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
}

export const denyLeekFlag = async ({ ack, client, body }:
  AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockButtonAction>) => {
  logOps.debug(`review-queue`, `received event data:`, JSON.stringify(body))
  const { user, actions, channel, message } = body
  const { id: botAdminId } = user
  const { value, action_id } = actions[0]

  // ack it first before doing any other processing
  await ack()

  // check if the user is a bot admin
  if (await checkIfAdmin(botAdminId) == false) {
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

  logOps.info(`review-queue:${entry.message_id}`, `denying from queue by ${botAdminId}`)
  entry = await prisma.slackLeeks.update({
    where: {
      message_id: entry.message_id,
    },
    data: {
      status: SlackLeeksStatus.Rejected
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
      new TextSection(new MarkdownText(`:x: Denied by <@${botAdminId}>`)).render(),
      new ContextSection([
        new MarkdownText(`Original message ID on database: \`${entry.message_id}\``)
      ]).render()
    ]
  })
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
      status: SlackLeeksStatus.Pending
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
  AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockButtonAction>) => {
  const { user, actions, message, channel } = body;
  const { id: botAdminId } = user
  const { value, } = actions[0]
  const isAdmin = await checkIfAdmin(botAdminId)

  // ack it first before doing any other processing
  await ack()

  if (!isAdmin) {
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

  if (entry.status == 'approved') {
    await client.chat.postMessage({
      channel: detectEnvForChannel(),
      thread_ts: entry.leeks_channel_post_id,
      text: ":warning: This leek was flagged as false positive by an reviewer. Please stop replying to this thread and apologies for those notified."
    })

    await client.chat.delete({
      channel: detectEnvForChannel(),
      ts: entry.leeks_channel_post_id
    })

    await client.chat.update({
      channel: queueChannel,
      ts: entry.review_queue_id,
      blocks: [
        message.blocks[0],
        message.blocks[1],
        message.blocks[2],
        message.blocks[3],
        new TextSection(new MarkdownText(`:leftwards_arrow_with_hook: Undo approval and delete by <@${botAdminId}>`)).render(),
        new ContextSection([
          new MarkdownText(`Original message ID on database: \`${entry.message_id}\``)
        ]).render()
      ]
    })

    await client.chat.postMessage({
      channel: queueChannel,
      thread_ts: entry.review_queue_id,
      text: `:leftwards_arrow_with_hook: Reversed by <@${botAdminId}>`,
    })

    entry = await prisma.slackLeeks.update({
      where: {
        message_id: entry.message_id
      },
      data: {
        leeks_channel_post_id: "deleted",
        status: SlackLeeksStatus.FlaggedAsNotLeek
      }
    })

    await sendDM(entry.first_flagged_by, `Hey there, we had to taken down your previously flagged leek from the channel because it is not a leek. You can appeal it in #leeksbot-meta if this is really a leek.`)
  } else if (entry.status == SlackLeeksStatus.FlaggedAsNotLeek || entry.status == SlackLeeksStatus.Rejected) {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: "modal",
        title: new PlainText("Leek already flagged as not leek").render(),
        blocks: new Blocks([
          new TextSection(new MarkdownText(`This leek was already flagged as not leek or rejected. If you need to reflag this, run \`${getBaseSlashCommand()} queue ${entry.message_id}\`.`))
        ]).render()
      }
    })
  }
}

export const ignore_leek = async ({ ack, client, body }:
  AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockButtonAction>) => {
  // ack first
  await ack();

  // get DB data before doing anything
  const entry = await prisma.slackLeeks.findFirst({
    where: {
      review_queue_id: body.actions[0].value
    }
  })
  logOps.info(`review-queue:${entry.message_id}`, `ignoring and deleting review_queue message`)

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: "modal",
      title: new PlainText("Queue message removed").render(),
      blocks: new Blocks([
        new TextSection(new MarkdownText(`If you need this back, just send \`${getBaseSlashCommand()} queue ${entry.message_id}\` and it will be added back here.`))
      ]).render()
    }
  })

  await prisma.slackLeeks.update({
    where: {
      message_id: body.actions[0].value
    },
    data: {
      review_queue_id: "deleted",
      status: SlackLeeksStatus.Ignored
    }
  })

  await client.chat.delete({
    channel: queueChannel,
    ts: body.message.ts
  })
}