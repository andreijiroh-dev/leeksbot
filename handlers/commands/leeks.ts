import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { generateReviewQueueMessage, helpCommand, permissionDenied } from "../../lib/blocks";
import { botAdmins, queueChannel } from "../../lib/constants";
import { logOps, prisma } from "../../app";
import { detectEnvForChannel, getBaseSlashCommand } from "../../lib/env";
import { Blocks, ContextSection, MarkdownText, PlainText, TextSection } from "../../lib/block-builder";
import { sendDM } from "../../lib/utils";
import { checkIfAdmin } from "../../lib/admin";
import { SlackLeeksStatus } from "../../lib/types";
import { helpOps, pingOps, statusOps } from "./sub-utils";

export const botCommandHandler = async ({
  ack,
  respond,
  payload,
  say,
  client,
  context,
  logger,
  next
}: AllMiddlewareArgs & SlackCommandMiddlewareArgs) => {
  const {text, user_id, channel_id, channel_name} = payload;
  const isThisBotAdmin = await checkIfAdmin(user_id);
  const params = text.split(" ")

  logOps.info(
    "received slash command data:",
    JSON.stringify({
      text,
      user_id,
      channel_id,
      channel_name,
      params,
      isThisBotAdmin
  }))

  // ack first
  await ack()

  switch (params[0]) {
    case "ping": await pingOps({ack, respond, payload, say, client, context, logger, next, command: payload, body: payload}); return;
    case "help": await helpOps({ack, respond, payload, say, client, context, logger, next, command: payload, body: payload}); return;
    case "status": await statusOps({ack, respond, payload, say, client, context, logger, next, command: payload, body: payload}); return;
  }

  if (params[0] == "status") {
    let entry;

    // if starts with p, look up by the permalink_message_id string
    if (params[1].startsWith("p")) {
      entry = await prisma.slackLeeks.findFirst({
        where: {
          permalink_message_id: params[1]
        }
      })
    // otherwise, do this instead
    } else {
      entry = await prisma.slackLeeks.findFirst({
        where: {
          message_id: params[1]
        }
      })
    }

    logOps.info(`slash-commands:status`, `db query for ${params[1]}:`, JSON.stringify(entry))

    if (!entry) {
      await respond(":warning: Either that does not exist or you used the last part from the permalink but not yet recorded on our end. If you paste the message ID with any formatting with it, try again pasting without it.")
      return;
    }

    const {permalink} = await client.chat.getPermalink({
      message_ts: entry.message_id,
      channel: entry.channel_id
    })

    await respond({
      blocks: new Blocks([
        new TextSection(
          new MarkdownText("Here's what we got from our database for this request."),
          "db_results",
          [
            new MarkdownText("*Message ID*"),
            new MarkdownText(`\`${entry.message_id}\``),
            new MarkdownText("*Permalink*"),
            new MarkdownText(permalink),
            new MarkdownText("*First flagged by"),
            new MarkdownText(`<@${entry.first_flagged_by}>`),
            new MarkdownText("*Status*"),
            new PlainText(entry.status)
          ]
        ),
        new ContextSection([
          new MarkdownText("If you use the permalink version of message ID (starts with `p`), this might be inaccurate.")
        ])
      ]).render()
    })
  } else if (params[0] == "queue") {
    let entry;

    // if starts with p, look up by the permalink_message_id string
    if (params[1].startsWith("p")) {
      entry = await prisma.slackLeeks.findFirst({
        where: {
          permalink_message_id: params[1]
        }
      })
      // otherwise, do this instead
    } else {
      entry = await prisma.slackLeeks.findFirst({
        where: {
          message_id: params[1]
        }
      })
    }

    if (isThisBotAdmin == false) {
      await respond({
        blocks: permissionDenied
      })
      return;
    }

    // if we deleted it via "deny_leek" or "ignore_leek", recreate it
    if (entry.review_queue_id == "deleted") {
      const review = await client.chat.postMessage({
        channel: queueChannel,
        blocks: await generateReviewQueueMessage(
          entry.message_id,
          entry.channel_id,
          entry.first_flagged_by,
          "requeued"
        )
      })

      entry = await prisma.slackLeeks.update({
        where: {
          message_id: entry.message_id
        },
        data: {
          review_queue_id: review.ts,
          status: "pending"
        }
      })
    } else {
      entry = await prisma.slackLeeks.update({
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
    }

    await sendDM(entry.first_flagged_by, `Hey there, we have requeued your leek flag (message ID: \`${entry.message_id}\`) for review by an admin. Expect another message here for any updates.`)
  } else if (params[0] == "nuke-from-leeks") {
    let entry;

    if (params.length < 2) {
      await respond({
        text: `You need to provide a message ID to use this feature.`
      })
      return;
    }

    // if starts with p, look up by the permalink_message_id string
    if (params[1].startsWith("p")) {
      entry = await prisma.slackLeeks.findFirst({
        where: {
          permalink_message_id: params[1]
        }
      })
      // otherwise, do this instead
    } else {
      entry = await prisma.slackLeeks.findFirst({
        where: {
          message_id: params[1]
        }
      })
    }

    const { messages: reviewQueueData } = await client.conversations.history({
      channel: queueChannel,
      latest: entry.review_queue_id,
      limit: 1
    })

    if (isThisBotAdmin == false) {
      await respond({
        blocks: permissionDenied
      })
      return;
    }

    if (!entry) {
      await respond({
        text: ":warning: Either that does not exist or you used the last part from the permalink but not yet recorded on our end. If you paste the message ID with any formatting with it, try again pasting without it."
      })
      return;
    }

    if (entry.status == SlackLeeksStatus.Approved) {
      await client.chat.postMessage({
        channel: detectEnvForChannel(),
        thread_ts: entry.leeks_channel_post_id,
        text: ":warning: This leek was flagged as false positive by an reviewer. Please stop replying to this thread and apologies for those notified."
      })

      await client.chat.delete({
        channel: detectEnvForChannel(),
        ts: entry.leeks_channel_post_id
      })

      await prisma.slackLeeks.update({
        where: {
          message_id: entry.message_id
        },
        data: {
          leeks_channel_post_id: "deleted",
          status: SlackLeeksStatus.Rejected
        }
      })

      const { blocks,  } = reviewQueueData[0]

      await client.chat.update({
        channel: queueChannel,
        ts: entry.review_queue_id,
        blocks: [

        ]
      })

      await respond({
        text: `Successfully removed the leek flag for message ID \`${entry.message_id}\`.`
      })
    } else {
      await respond({
        text: `This leek flag entry is not approved yet. Check the queue channel and remove it from the queue.`
      })
    }
  } else {
    await respond({
      text: `I didn't understand that command or probably unimplemented yet. Try \`${getBaseSlashCommand()} help\`.`
    })
  }
}