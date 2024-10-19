import type {
  AllMiddlewareArgs,
  SlackEventMiddlewareArgs
} from "@slack/bolt"
import { leeksReactionEmojis } from "../../lib/constants";
import { detectEnvForChannel } from "../../lib/env";
import { prisma } from "../../app";

export const leeksReactionCb = async ({
  client,
  event
}: AllMiddlewareArgs & SlackEventMiddlewareArgs<"reaction_added">) => {
  const { item, reaction, user } = event
  if (item.channel === detectEnvForChannel()) return;
  if (!leeksReactionEmojis.includes(reaction)) return;

  let entry = await prisma.slackLeeks.findFirst({
    where: {
      message_id: item.ts
    }
  })

  const { permalink } = await client.chat.getPermalink({
    channel: item.channel,
    message_ts: item.ts
  })

  if (entry === null) {
    entry = await prisma.slackLeeks.create({
      data: {
        message_id: item.ts,
        channel_id: item.channel,
        leeksReact: 1,
        first_flagged_by: user
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
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "New possible leek for review"
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Link to original message*: ${permalink}`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*First flagged by*: <@${user}>`
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Method*: Leeks reaction"
            }
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Approve and post",
                  emoji: true
                },
                value: item.ts,
                action_id: "approve_leek"
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Deny",
                  emoji: true
                },
                value: item.ts,
                action_id: "deny_leek"
              }
            ],
            block_id: "review_queue_buttons"
          }
        ]
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