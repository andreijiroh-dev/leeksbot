import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from "@slack/bolt";
import { helpCommand } from "../../lib/blocks";
import { botAdmins } from "../../lib/constants";
import { logOps } from "../../app";

export const botCommandHandler = async ({
  ack,
  respond,
  payload,
  say
}: AllMiddlewareArgs & SlackCommandMiddlewareArgs) => {
  const {text, user_id, channel_id, channel_name} = payload;
  const isThisBotAdmin = botAdmins.includes(user_id);
  const params = text.split(" ")

  logOps.debug(
    "received slash command data:",
    JSON.stringify({
      text,
      user_id,
      channel_id,
      channel_name,
      params,
      isThisBotAdmin
  }))

  await ack()

  if (!text || text == "" || text == "help") {
    await respond({
      blocks: helpCommand
    })
  }

  if (params[0] == "status") {
    await respond({
      text: "Working on it soon"
    })
  }
}