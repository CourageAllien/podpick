/**
 * PodPick — Unipile wrapper for sending pitches from client's own Gmail/Outlook
 *
 * Flow:
 *  1. Client connects Gmail/Outlook during intake via Unipile OAuth
 *  2. We store unipile_account_id on client_profiles
 *  3. When sending a pitch, we call Unipile's send API using that account
 *  4. The host receives email from the client's actual address
 *  5. Replies route back to the client's inbox directly
 *
 * Docs: https://docs.unipile.com (verify exact endpoint paths in Postman before
 * production use — Unipile's API surface evolves)
 */

const UNIPILE_BASE_URL = process.env.UNIPILE_BASE_URL || 'https://api.unipile.com:9443';
const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY;

if (!UNIPILE_API_KEY) {
  console.warn('UNIPILE_API_KEY not set — Unipile calls will fail');
}

export type UnipileSendParams = {
  accountId: string;          // unipile_account_id from client_profiles
  to: string;                  // host email
  subject: string;
  body: string;                // plain text or HTML
  threadId?: string;           // for in-thread replies (follow-ups)
  isHtml?: boolean;
};

export type UnipileSendResult = {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
};

/**
 * Send an email via Unipile using the client's connected inbox.
 */
export async function sendEmail(params: UnipileSendParams): Promise<UnipileSendResult> {
  try {
    const endpoint = `${UNIPILE_BASE_URL}/api/v1/emails`;

    const payload = {
      account_id: params.accountId,
      to: [{ identifier: params.to }],
      subject: params.subject,
      body: params.body,
      body_type: params.isHtml ? 'html' : 'text',
      ...(params.threadId ? { thread_id: params.threadId } : {}),
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-API-KEY': UNIPILE_API_KEY!,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Unipile send failed (${response.status}): ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.message_id || data.id,
      threadId: data.thread_id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Create an OAuth link for a client to connect their Gmail/Outlook.
 * Returns a URL the client visits to complete the OAuth flow.
 */
export async function createOAuthLink(params: {
  provider: 'GOOGLE' | 'OUTLOOK';
  clientProfileId: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
}): Promise<{ url: string; expiresAt: string } | { error: string }> {
  try {
    const endpoint = `${UNIPILE_BASE_URL}/api/v1/hosted/accounts/link`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-API-KEY': UNIPILE_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'create',
        providers: [params.provider],
        api_url: UNIPILE_BASE_URL,
        expiresOn: new Date(Date.now() + 60 * 60 * 1000).toISOString(),  // 1 hour
        name: params.clientProfileId,  // used to identify in webhook
        success_redirect_url: params.successRedirectUrl,
        failure_redirect_url: params.failureRedirectUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Failed to create OAuth link: ${errorText}` };
    }

    const data = await response.json();
    return {
      url: data.url,
      expiresAt: data.expiresOn,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Check account health — is the OAuth token still valid?
 */
export async function getAccountStatus(accountId: string): Promise<{
  connected: boolean;
  email?: string;
  provider?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${UNIPILE_BASE_URL}/api/v1/accounts/${accountId}`, {
      headers: {
        'X-API-KEY': UNIPILE_API_KEY!,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { connected: false, error: `Account fetch failed: ${response.status}` };
    }

    const data = await response.json();
    return {
      connected: data.status === 'OK',
      email: data.connection_params?.mail,
      provider: data.type,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * List recent received messages for an account.
 * Used by the response-tracking webhook to fetch inbound replies.
 */
export async function listRecentMessages(params: {
  accountId: string;
  since?: Date;
  limit?: number;
}): Promise<Array<{
  messageId: string;
  threadId: string;
  from: string;
  subject: string;
  body: string;
  receivedAt: string;
}> | { error: string }> {
  try {
    const queryParams = new URLSearchParams({
      account_id: params.accountId,
      limit: String(params.limit || 50),
    });

    if (params.since) {
      queryParams.set('after', params.since.toISOString());
    }

    const response = await fetch(
      `${UNIPILE_BASE_URL}/api/v1/emails?${queryParams}`,
      {
        headers: {
          'X-API-KEY': UNIPILE_API_KEY!,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return { error: `List messages failed: ${response.status}` };
    }

    const data = await response.json();
    return data.items.map((m: any) => ({
      messageId: m.message_id || m.id,
      threadId: m.thread_id,
      from: m.from_attendee?.identifier || m.from,
      subject: m.subject,
      body: m.body,
      receivedAt: m.date,
    }));
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
