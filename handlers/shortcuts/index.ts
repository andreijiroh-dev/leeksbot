import type { App } from '@slack/bolt';
import { handleMsgAction } from './leeks';

export const msgShortcutRegistry = (slackApp: App) => {
  slackApp.shortcut("leeks_flagops", handleMsgAction)
}