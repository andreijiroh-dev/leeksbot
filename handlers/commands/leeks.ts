import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { generateReviewQueueMessage, helpCommand, permissionDenied } from "../../lib/blocks";
import { botAdmins, queueChannel } from "../../lib/constants";
import { logOps, prisma } from "../../app";
import { getBaseSlashCommand } from "../../lib/env";
import { Blocks, ContextSection, MarkdownText, PlainText, TextSection } from "../../lib/block-builder";
import { sendDM } from "../../lib/utils";

export const botCommandHandler = async ({
  ack,
  respond,
  payload,
  say,
  client
}: AllMiddlewareArgs & SlackCommandMiddlewareArgs) => {
  const {text, user_id, channel_id, channel_name} = payload;
  const isThisBotAdmin = botAdmins.includes(user_id);
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

  if (!text || params[0] == "help") {
    await respond({
      blocks: helpCommand
    })
  } else if (params[0] == "status") {
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
      await respond(":warning: Either that does not exist or you used the last part from the permalink but not yet recorded on our end.")
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
  } else {
    await respond({
      text: `I didn't understand that command. Try \`${getBaseSlashCommand()} help\`.`
    })
  }
}