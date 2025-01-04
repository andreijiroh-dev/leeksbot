import { env } from "node:process"
import { leeksChannel, testingCenter } from "./constants"

type BotEnvConfig = {
  // environment name
  env: string,

  // Postgres URL string
  db?: string,

  port: string,

  slack: {
    botToken?: string,
    appToken?: string
    socketMode: boolean,
    sigSecret: string
  }

  sentry: {
    dsn: string
  }
}

export const config: BotEnvConfig = {
  env: env.NODE_ENV || "development",
  db: env.DATABASE_URL,
  port: env.PORT || "3000",
  slack: {
    botToken: env.SLACK_BOT_TOKEN,
    appToken: env.SLACK_APP_TOKEN,
    socketMode: env.NODE_ENV != "production",
    sigSecret: env.SLACK_SIGNING_SECRET
  },
  sentry: {
    dsn: env.SENTRY_DSN || "https://86feb85b378437aca113d95292a505cf@o1146989.ingest.us.sentry.io/4508580657102848"
  }
}

export function detectEnvForChannel() {
  if (config.env == "production") {
    return leeksChannel
  } else {
    return testingCenter
  }
}

export function getBaseSlashCommand() {
  if (config.env == "production") {
    return `/leeks`
  } else {
    return `/leeks-dev`
  }
}