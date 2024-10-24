import { AllMiddlewareArgs, MessageShortcut, SlackShortcutMiddlewareArgs } from "@slack/bolt";
import { Blocks, MarkdownText, PlainText, TextSection } from "../../lib/block-builder";
import { logOps, prisma } from "../../app";
import { detectEnvForChannel, getBaseSlashCommand } from "../../lib/env";
import { allowlistedChannels, queueChannel } from "../../lib/constants";
import { dequeuedMessage, dontUseItHere, generateReviewQueueMessage } from "../../lib/blocks";
import { extractPermalink, sendDM } from "../../lib/utils";

export const handleMsgAction = async ({
  client, ack, shortcut, respond
}: AllMiddlewareArgs & SlackShortcutMiddlewareArgs<MessageShortcut>) => {
  const { trigger_id, type, user, action_ts, callback_id, message_ts, channel } = shortcut
  const isChannelAllowlisted = allowlistedChannels.includes(shortcut.message_ts)

  logOps.info(`shortcuts:${callback_id}`, `received data:`, JSON.stringify({
    type,
    user,
    action_ts,
    trigger_id,
    message_ts,
    channel: channel.id
  }))

  // ack first
  await ack();

  // don't use the bot on the leeks channel itself or via DMs
  if (channel.id == detectEnvForChannel() || channel.id.startsWith("D")) {
    await client.views.open({
      trigger_id,
      view: {
        callback_id,
        type: "modal",
        title: new PlainText("Hold up!").render(),
        blocks: dontUseItHere
      }
    })
    return;
  }

  let entry = await prisma.slackLeeks.findFirst({
    where: {
      message_id: message_ts
    }
  })

  if (entry === null) {
    entry = await prisma.slackLeeks.create({
      data: {
        message_id: message_ts,
        channel_id: channel.id,
        leeksFlagCount: 1,
        first_flagged_by: user.id,
        status: isChannelAllowlisted === true ? "pending" : "dequeued",
        permalink_message_id: extractPermalink((await client.chat.getPermalink({
          channel: channel.id,
          message_ts: message_ts
        })).permalink)
      }
    })
  } else {
    entry = await prisma.slackLeeks.update({
      where: {
        message_id: message_ts
      },
      data: {
        leeksFlagCount: entry.leeksFlagCount + 1
      }
    })
  }

  if (entry.status == "pending") {
    if (!entry.review_queue_id || entry.review_queue_id == "deleted") {
      const review = await client.chat.postMessage({
        channel: queueChannel,
        blocks: await generateReviewQueueMessage(
          message_ts,
          channel.id,
          user.id,
          "msg_action"
        )
      })

      await prisma.slackLeeks.update({
        where: {
          message_id: message_ts,
        },
        data: {
          review_queue_id: review.ts
        }
      })
    }

    await sendDM(user.id, `Thanks for flagging the message privately (ID: \`${entry.message_id}\`) as a leek! If you flagged this for the first time, we'll reach to you via DMs if we approved it. If not, check its status via \`${getBaseSlashCommand()} status ${entry.message_id}\`.`)
  } else if (entry.status == "dequeued") {
    if (!entry.review_queue_id || entry.review_queue_id == "deleted") {
      const dequeued = await client.chat.postMessage({
        channel: queueChannel,
        blocks: dequeuedMessage(entry.message_id)
      })

      await prisma.slackLeeks.update({
        where: {
          message_id: message_ts
        },
        data: {
          review_queue_id: dequeued.ts
        }
      })
    }
    await sendDM(user.id, `You flagged as leek to a message (ID: \`${entry.message_id}\`) in this channel using message actions but it is none of our <https://mau.dev/andreijiroh-dev/leeksbot/-/blob/main/lib/constants.ts?ref_type=heads#L22|allowlisted channels>. We still logged it on the database just in case.`)
  } else if (entry.status == "rejected") {
    await sendDM(user.id, `The message you're trying to flag as leek (ID: \`${entry.message_id}\`) via message action was rejected by Leeks Bot Review Queue team (<!subteam^S07SN8KQZFC>). If this is a mistake, please contact one of them via DMs or at #leeksbot meta channel.`)
  }
}