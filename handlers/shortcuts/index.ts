import { MessageShortcut, type App } from '@slack/bolt';
import { handleMsgAction } from './leeks';

export const msgShortcutRegistry = (slackApp: App) => {
  slackApp.shortcut<MessageShortcut>("leeks_flagops",
    async (workflow) => await handleMsgAction(workflow)
  )
}