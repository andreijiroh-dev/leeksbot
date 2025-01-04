import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { helpCommand } from "../../lib/blocks";
import { logOps, prisma } from "../../app";
import { Blocks, ContextSection, MarkdownText, PlainText, TextSection } from "../../lib/block-builder";

export const pingOps = async ({
  respond,
  payload,
  say,
  client
}: AllMiddlewareArgs & SlackCommandMiddlewareArgs) => {
  await respond({
    text: "We're up!"
  })
}

export const helpOps = async ({
  respond,
  payload,
  say,
  client
}: AllMiddlewareArgs & SlackCommandMiddlewareArgs) => {
  await respond({
    blocks: helpCommand
  })
}

export const statusOps = async ({
  respond,
  payload,
  say,
  client
}: AllMiddlewareArgs & SlackCommandMiddlewareArgs) => {
  const { text } = payload;
  let entry;
  const params = text.split(" ")

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
}