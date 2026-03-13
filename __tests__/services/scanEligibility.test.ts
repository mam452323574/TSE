import { ApiService } from '@/services/api';
import { supabase } from '@/services/supabase';

// Mock supabase
jest.mock('@/services/supabase', () => ({
    supabase: {
        auth: {
            getSession: jest.fn(),
            getUser: jest.fn(),
        },
        from: jest.fn(),
    },
}));

// Mock fetch global
global.fetch = jest.fn();

describe('ApiService.checkScanEligibility', () => {
    const mockSession = {
        access_token: 'mock-token',
        user: { id: 'user-123' },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (supabase.auth.getSession as jest.Mock).mockResolvedValue({
            data: { session: mockSession },
        });
    });

    it('should return allowed for valid free user request within limits', async () => {
        const mockResponse = {
            success: true,
            allowed: true,
            message: 'Scan autorisé',
            current_count: 0,
            limit: 1,
            remaining: 1,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await ApiService.checkScanEligibility('health');

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(1);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/check-and-record-scan'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ scanType: 'health' }),
            })
        );
    });

    it('should return denied when limit is reached', async () => {
        const mockResponse = {
            success: true,
            allowed: false,
            message: 'Limite atteinte',
            current_count: 1,
            limit: 1,
            next_available_date: Date.now() + 86400000,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await ApiService.checkScanEligibility('health');

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.next_available_date).toBeDefined();
    });

    it('should handle welcome credits correctly', async () => {
        const mockResponse = {
            success: true,
            allowed: true,
            message: 'Crédit de bienvenue',
            welcome_credits: 1,
            current_count: 5, // Over limit but allowed due to credit
            limit: 1,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await ApiService.checkScanEligibility('body');

        expect(result.allowed).toBe(true);
        // Logic inside ApiService might calculate remaining based on limit-current, which would be negative
        // But verify API returns what we expect
        expect(result.welcome_credits).toBe(1);
    });

    it('should handle super scan for free users (denied)', async () => {
        const mockResponse = {
            success: true,
            allowed: false,
            message: 'Premium only',
            current_count: 0,
            limit: 0,
        };

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await ApiService.checkScanEligibility('super');

        expect(result.allowed).toBe(false);
        expect(result.limit).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Server error' }),
        });

        await expect(ApiService.checkScanEligibility('health'))
            .rejects.toThrow('Server error');
    });

    it('should fallback locally for super scan if backend rejects invalid type (backward compatibility)', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Invalid scan type' }),
        });

        // Mock insert for fallback
        const mockInsert = jest.fn().mockReturnThis();
        const mockSelect = jest.fn().mockReturnThis();
        const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'scan-123' }, error: null });

        (supabase.from as jest.Mock).mockReturnValue({
            insert: mockInsert,
            select: mockSelect,
            single: mockSingle,
        } as any);

        // Override local implementation for this test if needed, but ApiService logic is:
        // if (scanType === 'super' && error.error === 'Invalid scan type') -> fallback

        // Note: The mocked supabase.from needs to support the chain .insert().select().single()
        (supabase.from as jest.Mock).mockImplementation(() => ({
            insert: () => ({
                select: () => ({
                    single: () => Promise.resolve({ data: { id: 'fallback-id' }, error: null })
                })
            })
        }));

        const result = await ApiService.checkScanEligibility('super');

        expect(result.allowed).toBe(true);
        expect(result.message).toContain('fallback');
    });
});
