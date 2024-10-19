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
    socketMode: boolean
  }
}

export const config: BotEnvConfig = {
  env: env.NODE_ENV || "development",
  db: env.DATABASE_URL,
  port: env.PORT || "3000",
  slack: {
    botToken: env.SLACK_BOT_TOKEN,
    appToken: env.SLACK_APP_TOKEN,
    socketMode: Boolean(env.SLACK_APP_SOCKET_MODE) || true
  }
}

export function detectEnvForChannel() {
  if (config.env == "production") {
    return leeksChannel
  } else {
    return testingCenter
  }
}