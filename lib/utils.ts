
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


