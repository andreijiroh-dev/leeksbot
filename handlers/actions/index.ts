import { App } from "@slack/bolt";
import { addToQueueHandler, ignore_leek, reviewQueueHandler, undoApproveLeek } from "./review-queue";

export const blockActionsRegistry = (app: App) => {
  // buttons
  app.action("approve_leek", reviewQueueHandler);
  app.action("deny_leek", reviewQueueHandler);
  app.action("queue_for_review", addToQueueHandler);
  app.action("delete", undoApproveLeek)
  app.action("ignore_leek", ignore_leek)
}