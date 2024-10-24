import { App, BlockButtonAction } from "@slack/bolt";
import { reviewQueueHandler } from "./review-queue";
import { queueChannel } from "../../lib/constants";
import { logOps, prisma } from "../../app";
import { Blocks, MarkdownText, PlainText, TextSection } from "../../lib/block-builder";
import { getBaseSlashCommand } from "../../lib/env";

export const blockActionsRegistry = (app: App) => {
  // buttons
  app.action("approve_leek", reviewQueueHandler);
  app.action("deny_leek", reviewQueueHandler);
  app.action <BlockButtonAction>("ignore_leek", async({client, ack, body}) => {
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
        status: "ignored"
      }
    })

    await client.chat.delete({
      channel: queueChannel,
      ts: body.message.ts
    })
  })
}