import { AllMiddlewareArgs, SlackActionMiddlewareArgs, SlackShortcutMiddlewareArgs } from "@slack/bolt";
import { Blocks, MarkdownText, PlainText, TextSection } from "../../lib/block-builder";
import { logOps } from "../../app";
import { detectEnvForChannel } from "../../lib/env";

export const handleMsgAction = async ({
  shortcut, ack, client, body
}: AllMiddlewareArgs & SlackShortcutMiddlewareArgs) => {
  const { trigger_id, type, user, action_ts, callback_id } = shortcut
  const { message, channel } = body;
  logOps.info(`shortcuts:${callback_id}`, `received data:`, JSON.stringify({
    type,
    user,
    action_ts,
    message,
    channel
  }))

  // ack first
  await ack();

  // TODO: add the rest of the work here.
}