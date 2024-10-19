import { App, ExpressReceiver, LogLevel } from '@slack/bolt';
import { registerHandlers } from './handlers';
import { config } from './lib/env';
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

const receiver = new ExpressReceiver({
  signingSecret: "tbd"
})

const slackApp = new App({
  token: config.slack.botToken,
  appToken: config.slack.appToken,
  logLevel: LogLevel.DEBUG,
  socketMode: config.slack.socketMode,
  receiver: config.slack.socketMode !== true ? receiver : undefined
});

registerHandlers(slackApp);

receiver.router.get("/ping", (req, res) => {
  res.json({
    pk: true,
    message: "We're so back!"
  })
})

receiver.router.post('/secret-page', (req, res) => {
  // You're working with an express req and res now.
  res.send('yay!');
});

(async () => {
  try {
    await slackApp.start(config.port);
    await prisma.$connect()
    console.log('⚡️ Bolt app is running! ⚡️');
  } catch (error) {
    console.error('Unable to start App', error);
    await slackApp.stop()
    await prisma.$disconnect()
  }
})();