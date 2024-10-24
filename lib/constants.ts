/**
 * Slack user IDs for Leeks bot for admin features (such as deleting false
 * positives). If you need them, you must be the one of app collaborators
 * on Hack Club Slack. (ping ~ajhalili2006 via #ajhalili2006-lair or
 * #hackclub-leeks channel)
 */
export const botAdmins = [
  "U07CAPBB9B5", // ~ajhalili2006
  "U04G40QKAAD", // ~polypixeldev
  "U079A6KNYB1", // ~ssmidge
  "U059VC0UDEU" // ~skyfall
  // TODO: Add FD team members and Nest admins here
];

/**
 * The custom emoji IDs for #hackclub-leeks channel.
 */
export const leeksReactionEmojis = [
  "leeks",
  "leek"
]

export const allowlistedChannels = [
  "C0C78SG9L", // Hack Club HQ
  "C05SVRTCDGV", // HQ general engineering chat
  "CN523HLKW", // HCB Support channel
  "C054QL5JHU0", // HCB-specific dev chat
  "C0710J7F4U9", // YSWS meta channel
  "C01FXNNF6F2", // this is a bit tempting to look around Zach's channel here
  "C06RPCQH482", // Nest?
  "C016DEDUL87" // #cdn
]

/**
 * The Slack channel ID of #hackclub-leeks itself
 */
export const leeksChannel = "C06089401GT"
/**
 * Technically the channel ID of ~ajhalili2006's private channel for
 * Slack app development workflow testing.
 */
export const testingCenter = "C07F3GDQMJS"

export const queueChannel = "C07RS0CEQPP";
