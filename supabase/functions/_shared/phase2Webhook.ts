import { isRecord } from './phase2Utils.ts';

export interface Phase2WebhookResult {
  ok: boolean;
  status: number;
  payload: Record<string, unknown> | null;
  bodyPresent: boolean;
}

export async function postWebhookJson(
  url: string,
  payload: Record<string, unknown>,
  timeoutMs = 10000,
): Promise<Phase2WebhookResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Accept: 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const text = await response.text();
    let parsedPayload: Record<string, unknown> | null = null;

    if (text.trim().length > 0) {
      try {
        const parsed = JSON.parse(text);
        parsedPayload = isRecord(parsed) ? parsed : null;
      } catch {
        parsedPayload = null;
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      payload: parsedPayload,
      bodyPresent: text.trim().length > 0,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
