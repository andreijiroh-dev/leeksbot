import type {
  AllMiddlewareArgs,
  SlackEventMiddlewareArgs
} from "@slack/bolt"
import { allowlistedChannels, leeksReactionEmojis, queueChannel } from "../../lib/constants";
import { detectEnvForChannel, getBaseSlashCommand } from "../../lib/env";
import { logOps, prisma, slackApp } from "../../app";
import { dequeuedMessage, generateReviewQueueMessage } from "../../lib/blocks";
import { extractPermalink } from "../../lib/utils";

export const leeksReactionCb = async ({
  client,
  event
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<"reaction_added">) => {
  const { item, reaction, user, event_ts } = event
  const isChannelAllowlisted = allowlistedChannels.includes(item.channel)

  logOps.info("Received reaction data: ", JSON.stringify({
    item,
    user,
    reaction,
    event_ts,
    isChannelAllowlisted
  }))

  const permalink = (await slackApp.client.chat.getPermalink({
    channel: item.channel,
    message_ts: item.ts
  })).permalink

  if (item.channel === detectEnvForChannel()) return;
  if (!leeksReactionEmojis.includes(reaction)) return;

  let entry = await prisma.slackLeeks.findFirst({
    where: {
      message_id: item.ts
    }
  })

  if (entry === null) {
    entry = await prisma.slackLeeks.create({
      data: {
        message_id: item.ts,
        channel_id: item.channel,
        leeksReact: 1,
        first_flagged_by: user,
        status: isChannelAllowlisted === true ? "pending" : "dequeued",
        permalink_message_id: extractPermalink(permalink)
      }
    })
  } else {
    entry = await prisma.slackLeeks.update({
      where: {
        message_id: item.ts
      },
      data: {
        leeksReact: entry.leeksReact + 1
      }
    })
  }

  if (entry.status == "pending") {
    if (!entry.review_queue_id || entry.review_queue_id == "deleted") {
      const review = await client.chat.postMessage({
        channel: "C07RS0CEQPP",
        blocks: await generateReviewQueueMessage(
          item.ts,
          item.channel,
          user,
          "reaction")
      });

      await prisma.slackLeeks.update({
        where: {
          message_id: item.ts
        },
        data: {
          review_queue_id: review.ts
        }
      })
    }

    await client.chat.postEphemeral({
      channel: item.channel,
      user: user,
      text: `Thanks for flagging the message privately (ID: \`${entry.message_id}\`) as a leek! If you flagged this for the first time, we'll reach to you via DMs if we approved it. If not, check its status via \`${getBaseSlashCommand()} status ${entry.message_id}\`.`
    })
  } else if (entry.status == "dequeued") {
    if (!entry.review_queue_id || entry.review_queue_id == "deleted") {
      const dequeued = await client.chat.postMessage({
        channel: queueChannel,
        blocks: dequeuedMessage(entry.message_id)
      })

      await prisma.slackLeeks.update({
        where: {
          message_id: item.ts,
        },
        data: {
          review_queue_id: dequeued.ts
        }
      })
    }
    await client.chat.postEphemeral({
      channel: item.channel,
      user: user,
      text: `You reacted to a message (ID: \`${entry.message_id}\`) in this channel but it is none of our <https://mau.dev/andreijiroh-dev/leeksbot/-/blob/main/lib/constants.ts?ref_type=heads#L22|allowlisted channels>. We still logged it on the database just in case.`
    })
  } else if (entry.status == "rejected") {
    await client.chat.postEphemeral({
      channel: item.channel,
      user: user,
      text: `The message you're trying to flag as leek via reaction was rejected by Leeks Bot Review Queue team (<!subteam^S07SN8KQZFC>). If this is a mistake, please contact one of them via DMs or at #leeksbot meta channel.`
    })
  }
}

export const leeksReactionRemovalCb = async ({
  client,
  event
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<"reaction_added">) => {
  const { item, reaction, user, event_ts } = event
  const isChannelAllowlisted = allowlistedChannels.includes(item.channel)

  logOps.info("Received reaction data: ", JSON.stringify({
    item,
    user,
    reaction,
    event_ts,
    isChannelAllowlisted
  }))

  if (item.channel === detectEnvForChannel()) return;
  if (!leeksReactionEmojis.includes(reaction)) return;

  let entry = await prisma.slackLeeks.findFirst({
    where: {
      message_id: item.ts
    }
  })

  // if it is not in our database yet, ignore for now
  if (entry == null) return;

  entry = await prisma.slackLeeks.update({
    where: {
      message_id: item.ts
    },
    data: {
      leeksReact: entry.leeksReact - 1
    }
  })
}