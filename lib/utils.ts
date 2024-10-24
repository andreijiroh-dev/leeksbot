import { slackApp } from "../app";

/**
 * Extracts the last part of Slack message permalink through some regex.
 * Note that this code is AI-assisted via plain Google Gemini (not
 * Gemini Code Assist in Google Cloud Platform).
 * 
 * Note that since this could break things at the database side if we received
 * a leek through a message inside the thread.
 * 
 * @param permalinkUrl The full message permalink from Slack
 * @returns 
 */
export function extractPermalink(permalinkUrl) {
  const url = new URL(permalinkUrl);
  const pathname = url.pathname.split('/');
  const lastPathSegment = pathname[pathname.length - 1];
  if (lastPathSegment.startsWith('p')) {
    return lastPathSegment;
  }
}

/**
 * A utility function to easily sending a DM to someone without needing to doing
 * `client.conversations.open` first (it'll do that for you behind the scenes).
 * @param user Slack user ID
 * @param data Either a string or a object following `client.chat.postMessage` parameters
 * @returns 
 */
export async function sendDM(user: string, data: string | object) {
  try {
    const {channel: imChannelData} = await slackApp.client.conversations.open({
      users: user
    })
  
    let postMessageData: any = {
      channel: imChannelData.id,
    }
  
    if (typeof data == "string") {
      postMessageData.text = data
    } else if (typeof data == "object") {
      Object.assign(postMessageData, data)
    }
  
    return await slackApp.client.chat.postMessage(postMessageData)
  } catch (error) {
    throw Error(error)
  }
}
