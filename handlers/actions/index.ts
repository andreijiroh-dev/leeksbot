import { App } from "@slack/bolt";
import { reviewQueuehandler } from "./review-queue";

export const blockActionsRegistry = (app: App) => {
  app.action("approve_leek", reviewQueuehandler);
  app.action("deny_leek", reviewQueuehandler)
}