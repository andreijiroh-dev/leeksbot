import { App } from "@slack/bolt";
import { eventsRegistry } from "./events";
import { blockActionsRegistry } from "./actions";

export const registerHandlers = (app: App) => {
  eventsRegistry(app);
  blockActionsRegistry(app)
}