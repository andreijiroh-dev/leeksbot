import { App } from "@slack/bolt";
import { botCommandHandler } from "./leeks";

export const botComamndsRegistry = (slackApp: App) => {
  slackApp.command("/leeks", botCommandHandler);
  slackApp.command("/leeks-dev", botCommandHandler)
}