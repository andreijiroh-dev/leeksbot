/**
 * Types for the database backend are being worked on here,
 * and currently experimental.
 */

export enum SlackLeeksStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
  FlaggedAsNotLeek = "flagged_as_notleek",
  Ignored = "ignored"
}

export type SlackLeekTypes = {
  message_id: string
  channel_id: string
  permalink_message_id?: string
  leeks_channel_post_id?: string
  first_flagged_by: string
  status: SlackLeeksStatus
  review_queue_id?: string
  leeksReact: number
  leeksFlagCount: number
  readonly created_at: Date
  readonly updated_at: Date
}

export type SlackChannelTypes = {
  id: string
  allowlisted: boolean
  readonly created_at: Date
  readonly updated_at: Date
}

export type SlackUserTypes = {
  id: string
  bot_admin: boolean
  is_banned: boolean
  ban_reason?: string
  banned_by?: string
  banned_at?: Date
  readonly created_at: Date
  readonly updated_at: Date
}