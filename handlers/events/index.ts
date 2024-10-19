import { App } from "@slack/bolt";
import { leeksReactionCb } from "./leeks-reactions";

export const eventsRegistry = (app: App) => {
  app.event("reaction_added", leeksReactionCb)
}