import type {
  AllMiddlewareArgs,
  SlackEventMiddlewareArgs
} from "@slack/bolt"
import { allowlistedChannels, leeksReactionEmojis } from "../../lib/constants";
import { detectEnvForChannel } from "../../lib/env";
import { logOps, prisma } from "../../app";
import { generateReviewQueueMessage } from "../../lib/blocks";

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
        status: isChannelAllowlisted === true ? "pending" : "dequeued"
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
    if (!entry.review_queue_id || entry.review_queue_id == "") {
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