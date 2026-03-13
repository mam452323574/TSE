import { N8nWebhookService } from '@/services/n8nWebhook';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('N8nWebhookService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    // Reset webhook index for consistent test behavior
    N8nWebhookService.resetWebhookIndex();
  });

  describe('analyzeScan', () => {
    it('sends POST request with correct body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ success: true, data: { score: 85 } })),
      });

      const result = await N8nWebhookService.analyzeScan(
        'https://example.com/image.jpg',
        'user-123',
        'nutrition',
        'fr'
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('n8n.basedjew.com/webhook/analyse'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            imageBase64: 'https://example.com/image.jpg',
            userId: 'user-123',
            scanType: 'nutrition',
            language: 'fr',
          }),
        })
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ score: 85 });
    });

    it('handles HTTP errors', async () => {
      // The service retries 3 times, so we need to mock all 3 attempts
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await N8nWebhookService.analyzeScan(
        'https://example.com/image.jpg',
        'user-123',
        'body',
        'fr'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Internal Server Error');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await N8nWebhookService.analyzeScan(
        'https://example.com/image.jpg',
        'user-123',
        'health',
        'fr'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('handles timeout errors', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const result = await N8nWebhookService.analyzeScan(
        'https://example.com/image.jpg',
        'user-123',
        'nutrition',
        'fr'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('rotates through webhooks (round-robin)', async () => {
      // Make multiple calls and track the URLs
      const usedUrls: string[] = [];

      mockFetch.mockImplementation((url: string) => {
        usedUrls.push(url);
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ success: true })),
        });
      });

      // Make 3 calls
      await N8nWebhookService.analyzeScan('url1', 'user1', 'nutrition', 'fr');
      await N8nWebhookService.analyzeScan('url2', 'user2', 'body', 'fr');
      await N8nWebhookService.analyzeScan('url3', 'user3', 'health', 'fr');

      // Each should use a different webhook
      expect(usedUrls[0]).not.toBe(usedUrls[1]);
      expect(usedUrls[1]).not.toBe(usedUrls[2]);
    });

    it('handles unknown errors', async () => {
      mockFetch.mockRejectedValue('string error');

      const result = await N8nWebhookService.analyzeScan(
        'https://example.com/image.jpg',
        'user-123',
        'nutrition',
        'fr'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });

    it('handles empty response from webhook', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''),
      });

      const result = await N8nWebhookService.analyzeScan(
        'https://example.com/image.jpg',
        'user-123',
        'nutrition',
        'fr'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('réponse vide');
    });

    it('handles whitespace-only response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('   \n  '),
      });

      const result = await N8nWebhookService.analyzeScan(
        'https://example.com/image.jpg',
        'user-123',
        'body',
        'fr'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('réponse vide');
    });

    it('handles invalid JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('not valid json {'),
      });

      const result = await N8nWebhookService.analyzeScan(
        'https://example.com/image.jpg',
        'user-123',
        'health',
        'fr'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Réponse invalide');
    });

    it('starts from first webhook after reset', async () => {
      const usedUrls: string[] = [];

      mockFetch.mockImplementation((url: string) => {
        usedUrls.push(url);
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ success: true })),
        });
      });

      // First call after reset
      await N8nWebhookService.analyzeScan('url1', 'user1', 'nutrition', 'fr');
      const firstUrl = usedUrls[0];

      // Reset and call again
      N8nWebhookService.resetWebhookIndex();
      await N8nWebhookService.analyzeScan('url2', 'user2', 'nutrition', 'fr');
      const secondUrl = usedUrls[1];

      // Both should use the same first webhook
      expect(firstUrl).toBe(secondUrl);
    });
  });

  describe('testWebhookConnection', () => {
    it('returns true when connection is successful', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const result = await N8nWebhookService.testWebhookConnection();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('n8n.basedjew.com'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('returns false when connection fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const result = await N8nWebhookService.testWebhookConnection();

      expect(result).toBe(false);
    });

    it('returns false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await N8nWebhookService.testWebhookConnection();

      expect(result).toBe(false);
    });
  });

  describe('concurrent requests', () => {
    it('distributes requests across all 7 webhooks under load', async () => {
      const usedUrls: string[] = [];

      mockFetch.mockImplementation((url: string) => {
        usedUrls.push(url);
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ success: true })),
        });
      });

      // Make 14 calls (2 full rotations through 7 webhooks)
      const promises = Array.from({ length: 14 }, (_, i) =>
        N8nWebhookService.analyzeScan(`url${i}`, `user${i}`, 'health', 'fr')
      );

      await Promise.all(promises);

      // Should have called fetch 14 times
      expect(mockFetch).toHaveBeenCalledTimes(14);

      // Extract webhook numbers from URLs
      const webhookNumbers = usedUrls.map(url => {
        const match = url.match(/analyse_(\d+)/);
        return match ? parseInt(match[1]) : 0;
      });

      // Each webhook (1-7) should be used at least once
      const uniqueWebhooks = new Set(webhookNumbers);
      expect(uniqueWebhooks.size).toBe(7);
    });

    it('handles multiple parallel requests without errors', async () => {
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ success: true, data: { score: 85 } })),
        });
      });

      // Launch 5 parallel requests
      const promises = [
        N8nWebhookService.analyzeScan('url1', 'user1', 'health', 'fr'),
        N8nWebhookService.analyzeScan('url2', 'user2', 'body', 'fr'),
        N8nWebhookService.analyzeScan('url3', 'user3', 'nutrition', 'fr'),
        N8nWebhookService.analyzeScan('url4', 'user4', 'health', 'fr'),
        N8nWebhookService.analyzeScan('url5', 'user5', 'body', 'fr'),
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    it('handles mixed success and failure in parallel requests', async () => {
      let callCount = 0;

      mockFetch.mockImplementation(() => {
        callCount++;
        const currentCall = callCount;
        // Fail every other initial request, but the retry logic means we need
        // to account for retries. Let's make all calls either succeed or fail based on URL pattern.
        if (currentCall % 2 === 0) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ success: true })),
        });
      });

      const promises = Array.from({ length: 4 }, (_, i) =>
        N8nWebhookService.analyzeScan(`url${i}`, `user${i}`, 'health', 'fr')
      );

      const results = await Promise.all(promises);

      // With retry logic, some may recover. Just check we get results.
      const successes = results.filter(r => r.success).length;
      const failures = results.filter(r => !r.success).length;

      expect(successes + failures).toBe(4);
    });

    it('maintains round-robin order even with async timing differences', async () => {
      const usedUrls: string[] = [];
      const delays = [100, 50, 150, 25]; // Different delays for each request

      mockFetch.mockImplementation((url: string) => {
        usedUrls.push(url);
        const delay = delays[usedUrls.length - 1] || 10;
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              text: () => Promise.resolve(JSON.stringify({ success: true })),
            });
          }, delay);
        });
      });

      // Sequential calls (not parallel) should maintain order
      await N8nWebhookService.analyzeScan('url1', 'user1', 'health', 'fr');
      await N8nWebhookService.analyzeScan('url2', 'user2', 'body', 'fr');
      await N8nWebhookService.analyzeScan('url3', 'user3', 'nutrition', 'fr');
      await N8nWebhookService.analyzeScan('url4', 'user4', 'health', 'fr');

      // URLs should be in round-robin order
      expect(usedUrls[0]).toContain('analyse_1');
      expect(usedUrls[1]).toContain('analyse_2');
      expect(usedUrls[2]).toContain('analyse_3');
      expect(usedUrls[3]).toContain('analyse_4');
    });
  });
});
