import { ScanType, AnalysisType } from '@/types';

interface N8nAnalysisRequest {
  imageBase64: string;
  userId: string;
  scanType: ScanType;
  language?: string;
}

// Type pour les données d'analyse retournées par n8n
import { AnalysisResult } from '@/types';

export type N8nAnalysisData = AnalysisResult;

interface N8nAnalysisResponse {
  success: boolean;
  data?: N8nAnalysisData;
  error?: string;
}

const N8N_WEBHOOKS = [
  'https://n8n.basedjew.com/webhook/analyse_1',
  'https://n8n.basedjew.com/webhook/analyse_2',
  'https://n8n.basedjew.com/webhook/analyse_3',
  'https://n8n.basedjew.com/webhook/analyse_4',
  'https://n8n.basedjew.com/webhook/analyse_5',
  'https://n8n.basedjew.com/webhook/analyse_6',
  'https://n8n.basedjew.com/webhook/analyse_7',
];

// Super Scan utilise 2 serveurs de production avec alternance
const SUPER_SCAN_WEBHOOKS = [
  'https://n8n.basedjew.com/webhook/SUPERSCAN',   // Serveur A
  'https://n8n.basedjew.com/webhook/SUPERSCAN_2',  // Serveur B
];

export class N8nWebhookService {
  private static currentWebhookIndex = 0;
  private static currentSuperScanIndex = 0;

  private static getNextWebhookUrl(): string {
    const url = N8N_WEBHOOKS[this.currentWebhookIndex];
    this.currentWebhookIndex = (this.currentWebhookIndex + 1) % N8N_WEBHOOKS.length;
    return url;
  }

  private static getNextSuperScanWebhookUrl(): string {
    const url = SUPER_SCAN_WEBHOOKS[this.currentSuperScanIndex];
    this.currentSuperScanIndex = (this.currentSuperScanIndex + 1) % SUPER_SCAN_WEBHOOKS.length;
    return url;
  }

  static async analyzeScan(
    imageBase64: string,
    userId: string,
    scanType: ScanType,
    language: string
  ): Promise<N8nAnalysisResponse> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    let lastResponseError: string | null = null;

    // Retry loop
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Utiliser le webhook Super Scan ou webhook standard selon le type
        const webhookUrl = scanType === 'super'
          ? this.getNextSuperScanWebhookUrl()
          : this.getNextWebhookUrl(); // This automatically rotates the URL on each call

        // Strip data URI prefix if present (e.g., "data:image/jpeg;base64,")
        let cleanBase64 = imageBase64;
        if (imageBase64.includes(',')) {
          cleanBase64 = imageBase64.split(',')[1];
        }

        const requestBody: N8nAnalysisRequest = {
          imageBase64: cleanBase64,
          userId,
          scanType,
          language,
        };

        console.log('[LANG-DEBUG] N8n webhook requestBody.language:', requestBody.language, '| scanType:', scanType);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`[N8n] Webhook request failed (${webhookUrl}):`, response.status, response.statusText);
          throw new Error(`Webhook request failed (${webhookUrl}): ${response.statusText}`);
        }

        const responseText = await response.text();

        // Gérer le cas d'une réponse vide - Retry condition
        if (!responseText || responseText.trim().length === 0) {
          lastResponseError = 'Le webhook n8n a retourné une réponse vide (serveur surchargé ou en erreur).';
          if (attempt < maxRetries - 1) await new Promise(resolve => setTimeout(resolve, 1500));
          continue; // Try next server
        }

        let data: N8nAnalysisResponse;
        try {
          data = JSON.parse(responseText);
          return data; // Success!
        } catch (parseError) {
          console.warn(`[N8n] Attempt ${attempt + 1} JSON parse failed. Retrying...`, parseError);
          lastResponseError = `Réponse invalide du webhook n8n: ${responseText.substring(0, 100)}`;
          if (attempt < maxRetries - 1) await new Promise(resolve => setTimeout(resolve, 1500));
          continue; // Try next server
        }

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('[N8n] Request timeout on attempt', attempt + 1);
          lastError = new Error('Request timeout - one of the servers is slow');
          // continue loop to try next server if time (though 60s is long, maybe we should reduce timeout per attempt? keeping 60s for now as safe bet)
        } else {
          console.error(`[N8n] Error on attempt ${attempt + 1}:`, error);
          lastError = error instanceof Error ? error : new Error('Unknown error');
        }

        if (attempt < maxRetries - 1) await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // All retries failed
    return {
      success: false,
      error: lastResponseError || (lastError ? lastError.message : 'All analysis servers failed to respond correctly.'),
    };
  }

  static async testWebhookConnection(): Promise<boolean> {
    try {
      const response = await fetch(N8N_WEBHOOKS[0], {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('[N8n] Connection test error:', error);
      return false;
    }
  }

  /**
   * Reset the webhook index to 0 (useful for tests)
   */
  static resetWebhookIndex(): void {
    this.currentWebhookIndex = 0;
    this.currentSuperScanIndex = 0;
  }

  /**
   * Reset only the Super Scan webhook index to 0 (useful for tests)
   */
  static resetSuperScanWebhookIndex(): void {
    this.currentSuperScanIndex = 0;
  }
}

export type { N8nAnalysisRequest, N8nAnalysisResponse };
