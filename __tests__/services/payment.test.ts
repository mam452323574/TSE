import { Platform } from 'react-native';
import { paymentService } from '@/services/payment';

// Mock react-native-iap
const mockInitConnection = jest.fn();
const mockEndConnection = jest.fn();
const mockGetProducts = jest.fn();
const mockRequestPurchase = jest.fn();
const mockGetAvailablePurchases = jest.fn();
const mockFinishTransaction = jest.fn();
const mockPurchaseUpdatedListener = jest.fn();
const mockPurchaseErrorListener = jest.fn();

jest.mock('react-native-iap', () => ({
  initConnection: () => mockInitConnection(),
  endConnection: () => mockEndConnection(),
  getProducts: (params: any) => mockGetProducts(params),
  requestPurchase: (params: any) => mockRequestPurchase(params),
  getAvailablePurchases: () => mockGetAvailablePurchases(),
  finishTransaction: (params: any) => mockFinishTransaction(params),
  purchaseUpdatedListener: (callback: any) => {
    mockPurchaseUpdatedListener(callback);
    return { remove: jest.fn() };
  },
  purchaseErrorListener: (callback: any) => {
    mockPurchaseErrorListener(callback);
    return { remove: jest.fn() };
  },
}));

// Mock supabase
jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
    },
  },
}));

// Mock fetch for verification
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('paymentService', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInitConnection.mockResolvedValue(true);
    mockEndConnection.mockResolvedValue(undefined);
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  });

  afterEach(async () => {
    Object.defineProperty(Platform, 'OS', { value: originalPlatform, configurable: true });
    // Clean up service state
    await paymentService.cleanup();
  });

  describe('initialize', () => {
    it('initializes IAP connection', async () => {
      await paymentService.initialize();

      expect(mockInitConnection).toHaveBeenCalled();
    });

    it('sets up purchase listeners', async () => {
      await paymentService.initialize();

      expect(mockPurchaseUpdatedListener).toHaveBeenCalled();
      expect(mockPurchaseErrorListener).toHaveBeenCalled();
    });

    it('only initializes once', async () => {
      await paymentService.initialize();
      await paymentService.initialize();

      expect(mockInitConnection).toHaveBeenCalledTimes(1);
    });

    it('throws on initialization error', async () => {
      mockInitConnection.mockRejectedValueOnce(new Error('Init failed'));
      
      // Reset the service state first
      await paymentService.cleanup();

      await expect(paymentService.initialize()).rejects.toThrow('Failed to initialize payment service');
    });
  });

  describe('getProductDetails', () => {
    it('returns product on Android', async () => {
      const mockProduct = {
        productId: 'health_scan_premium_monthly',
        title: 'Premium Monthly',
        price: '4.99',
      };
      mockGetProducts.mockResolvedValueOnce([mockProduct]);

      const result = await paymentService.getProductDetails();

      expect(mockGetProducts).toHaveBeenCalledWith({
        skus: ['health_scan_premium_monthly'],
      });
      expect(result).toEqual(mockProduct);
    });

    it('returns product on iOS', async () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
      
      const mockProduct = { productId: 'health_scan_premium_monthly' };
      mockGetProducts.mockResolvedValueOnce([mockProduct]);

      const result = await paymentService.getProductDetails();

      expect(result).toEqual(mockProduct);
    });

    it('returns null when no products found', async () => {
      mockGetProducts.mockResolvedValueOnce([]);

      const result = await paymentService.getProductDetails();

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      mockGetProducts.mockRejectedValueOnce(new Error('Fetch error'));

      const result = await paymentService.getProductDetails();

      expect(result).toBeNull();
    });
  });

  describe('purchaseProduct', () => {
    beforeEach(async () => {
      await paymentService.initialize();
    });

    it('initiates purchase successfully', async () => {
      mockRequestPurchase.mockResolvedValueOnce({});

      const result = await paymentService.purchaseProduct();

      expect(mockRequestPurchase).toHaveBeenCalledWith({
        sku: 'health_scan_premium_monthly',
      });
      expect(result.success).toBe(true);
      expect(result.message).toBe('Purchase initiated successfully');
    });

    it('handles user cancellation', async () => {
      const cancelError = new Error('User cancelled');
      (cancelError as any).code = 'E_USER_CANCELLED';
      mockRequestPurchase.mockRejectedValueOnce(cancelError);

      const result = await paymentService.purchaseProduct();

      expect(result.success).toBe(false);
      expect(result.error).toBe('cancelled');
    });

    it('handles purchase errors', async () => {
      const purchaseError = new Error('Purchase failed');
      (purchaseError as any).code = 'E_PURCHASE_ERROR';
      mockRequestPurchase.mockRejectedValueOnce(purchaseError);

      const result = await paymentService.purchaseProduct();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Purchase failed');
    });
  });

  describe('restorePurchases', () => {
    beforeEach(async () => {
      await paymentService.initialize();
    });

    it('returns error when no purchases available', async () => {
      mockGetAvailablePurchases.mockResolvedValueOnce([]);

      const result = await paymentService.restorePurchases();

      expect(result.success).toBe(false);
      expect(result.error).toBe('no_purchases');
    });

    it('returns error when no premium purchase found', async () => {
      mockGetAvailablePurchases.mockResolvedValueOnce([
        { productId: 'some_other_product' },
      ]);

      const result = await paymentService.restorePurchases();

      expect(result.success).toBe(false);
      expect(result.error).toBe('no_premium_purchase');
    });

    it('restores premium purchase successfully', async () => {
      const premiumPurchase = {
        productId: 'health_scan_premium_monthly',
        transactionReceipt: 'receipt-123',
        purchaseToken: 'token-123',
      };
      mockGetAvailablePurchases.mockResolvedValueOnce([premiumPurchase]);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const result = await paymentService.restorePurchases();

      expect(result.success).toBe(true);
      expect(result.purchase).toEqual(premiumPurchase);
    });

    it('handles HTTP error during verification', async () => {
      const premiumPurchase = {
        productId: 'health_scan_premium_monthly',
        transactionReceipt: 'receipt-123',
        purchaseToken: 'token-123',
      };
      mockGetAvailablePurchases.mockResolvedValueOnce([premiumPurchase]);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      const result = await paymentService.restorePurchases();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Unauthorized');
    });

    it('handles HTTP error with no error message', async () => {
      const premiumPurchase = {
        productId: 'health_scan_premium_monthly',
        transactionReceipt: 'receipt-123',
        purchaseToken: 'token-123',
      };
      mockGetAvailablePurchases.mockResolvedValueOnce([premiumPurchase]);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      const result = await paymentService.restorePurchases();

      expect(result.success).toBe(false);
      expect(result.message).toContain('HTTP error: 500');
    });

    it('handles JSON parse error during HTTP error', async () => {
      const premiumPurchase = {
        productId: 'health_scan_premium_monthly',
        transactionReceipt: 'receipt-123',
        purchaseToken: 'token-123',
      };
      mockGetAvailablePurchases.mockResolvedValueOnce([premiumPurchase]);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await paymentService.restorePurchases();

      expect(result.success).toBe(false);
      expect(result.message).toContain('HTTP error: 500');
    });
  });

  describe('purchaseProduct auto-initialization', () => {
    it('auto-initializes when not initialized before purchase', async () => {
      // Ensure service is not initialized
      await paymentService.cleanup();
      
      mockRequestPurchase.mockResolvedValueOnce({});

      const result = await paymentService.purchaseProduct();

      expect(mockInitConnection).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('removes listeners and ends connection', async () => {
      await paymentService.initialize();
      await paymentService.cleanup();

      expect(mockEndConnection).toHaveBeenCalled();
    });

    it('handles cleanup when not initialized', async () => {
      await expect(paymentService.cleanup()).resolves.not.toThrow();
    });
  });
});
