import { ActionsSection, Blocks, ButtonAction, ContextSection, DividerSection, HeaderSection, MarkdownText, PlainText, TextSection } from "./block-builder";
import { slackApp } from "../app";
import { getBaseSlashCommand } from "./env";

export const helpCommand = [
  new HeaderSection(new PlainText("Help commands for leeksbot")).render(),
  new DividerSection().render(),
  new TextSection(new MarkdownText("Most of the commands here are either used as utility or reserved to bot admins only.")).render(),
  new DividerSection().render(),
  new TextSection(new MarkdownText(`\`${getBaseSlashCommand()} help\` - show this help message`)).render(),
  new TextSection(new MarkdownText(`\`${getBaseSlashCommand()} status <message_id>\` - get status of a message on the review queue`)).render(),
  new DividerSection().render(),
  new TextSection(new MarkdownText("If you found any bugs, please report it in #leeksbot channel or via the issue tracker")).render()
]

export const generateReviewQueueMessage = async (
  msg_id: string,
  channel_id: string,
  user_id: string,
  method: "reaction" | "msg_action"
) => {
  const { permalink } = await slackApp.client.chat.getPermalink({
    channel: channel_id,
    message_ts: msg_id
  })

  let submissionMethod;

  if (method == "reaction") submissionMethod == "Leeks reaction";
  if (method == "msg_action") submissionMethod == "Flag as leeks message reaction";

  return new Blocks([
    new HeaderSection(new PlainText("New possible leek for review")),
    new TextSection(new MarkdownText(`*Link to original message*: ${permalink}`)),
    new TextSection(new MarkdownText(`*Flagged by*: <@${user_id}>`)),
    new TextSection(new MarkdownText(`*Method*: ${submissionMethod}`)),
    new ActionsSection([
      new ButtonAction(
        new PlainText(":true: Approve and post", true),
        msg_id,
        "approve_leek"
      ),
      new ButtonAction(
        new PlainText(":x: Deny", true),
        msg_id,
        "deny_leek"
      )
    ]),
    new ContextSection([
      new MarkdownText(`Original message ID on database: \`${msg_id}\``)
    ])
  ]).render()
}

export const dequeuedMessage = (
  msg_id: string,
) => {
  return new Blocks([
    new HeaderSection(new PlainText("Possible leek but dequeued")),
    new TextSection(new MarkdownText("We're not showing the metadata for this one because the original message is posted outside the allowlisted channels.")),
    new TextSection(new MarkdownText(`To add back to the review queue, run \`/leeks[-dev] queue ${msg_id}\` or press the *Add to review queue* button below and the bot will add it back to the queue.`)),
    new ActionsSection([
      new ButtonAction(
        new PlainText("Add to review queue"),
        msg_id,
        "queue_for_review"
      ),
      new ButtonAction(
        new PlainText("Ignore"),
        msg_id,
        "ignore_leek"
      )
    ]),
    new ContextSection([
      new MarkdownText(`Original message ID on database: \`${msg_id}\``)
    ])
  ]).render()
}

export const permissionDenied = new Blocks([
  new TextSection(new MarkdownText(":x: You don't have enough permissions to do this. If you're a review queue team member for leeksbot, please <https://github.com/andreijiroh-dev/issues|file a new issue> or contact @ajhalili2006."))
]).render()