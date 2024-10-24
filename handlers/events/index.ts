import { App } from "@slack/bolt";
import { leeksReactionCb, leeksReactionRemovalCb } from "./leeks-reactions";

export const eventsRegistry = (slackApp: App) => {
  slackApp.event("reaction_added", leeksReactionCb)
  slackApp.event("reaction_removed", leeksReactionRemovalCb)
}