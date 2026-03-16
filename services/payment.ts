import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Check if we are running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Dynamic import type definitions for IAP
let IAP: any = null;

const getIAP = async () => {
  if (IAP) return IAP;
  if (isExpoGo) {
    console.log('[PaymentService] Running in Expo Go, IAP native modules disabled');
    return null;
  }
  
  try {
    IAP = await import('react-native-iap');
    return IAP;
  } catch (error) {
    console.error('[PaymentService] Failed to load react-native-iap:', error);
    return null;
  }
};

export type Product = any;
export type Purchase = any;
export type PurchaseError = any;


const MONTHLY_PRODUCT_IDS = {
  android: ['health_scan_premium_monthly'],
  ios: ['health_scan_premium_monthly'],
};

const ANNUAL_PRODUCT_IDS = {
  android: ['health_scan_premium_annual'],
  ios: ['health_scan_premium_annual'],
};

export interface PurchaseResult {
  success: boolean;
  message: string;
  purchase?: Purchase;
  error?: string;
}

class PaymentService {
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const iap = await getIAP();
      if (!iap) return;

      await iap.initConnection();
      this.isInitialized = true;
      this.setupPurchaseListeners(iap);
    } catch (error: any) {
      // E_IAP_NOT_AVAILABLE is expected in Expo Go - fail silently
      if (error?.code === 'E_IAP_NOT_AVAILABLE' || error?.message?.includes('E_IAP_NOT_AVAILABLE')) {
        console.log('[PaymentService] IAP not available (expected in Expo Go)');
        return;
      }
      console.error('[PaymentService] Initialization error:', error);
      throw new Error('Failed to initialize payment service');
    }
  }

  private setupPurchaseListeners(iap: any): void {
    this.purchaseUpdateSubscription = iap.purchaseUpdatedListener(
      async (purchase: Purchase) => {
        const receipt = purchase.purchaseToken;
        if (receipt) {
          try {
            await this.verifyAndFinalizePurchase(purchase);
          } catch (error) {
            console.error('[PaymentService] Error in purchase listener:', error);
          }
        }
      }
    );

    this.purchaseErrorSubscription = iap.purchaseErrorListener(
      (error: PurchaseError) => {
        console.error('[PaymentService] Purchase error:', error.code, error.message);
      }
    );
  }

  async getProductDetails(): Promise<Product | null> {
    try {
      // Ensure IAP is initialized before fetching products
      if (!this.isInitialized) {
        await this.initialize();
      }

      const iap = await getIAP();
      // If still not initialized (e.g., Expo Go), return null gracefully
      if (!this.isInitialized || !iap) {
        console.log('[PaymentService] IAP not initialized, cannot fetch products');
        return null;
      }

      const productIds = Platform.OS === 'android'
        ? MONTHLY_PRODUCT_IDS.android
        : MONTHLY_PRODUCT_IDS.ios;

      const products = await iap.fetchProducts({ skus: productIds, type: 'subs' });

      if (products && products.length > 0) {
        return products[0] as Product;
      }

      return null;
    } catch (error) {
      console.error('[PaymentService] Error fetching products:', error);
      return null;
    }
  }

  async purchaseProduct(): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const iap = await getIAP();
      if (!iap) {
        return {
          success: false,
          message: 'In-app purchases are not available in Expo Go. Please use a development build.',
          error: 'iap_unavailable',
        };
      }

      const productId = Platform.OS === 'android'
        ? MONTHLY_PRODUCT_IDS.android[0]
        : MONTHLY_PRODUCT_IDS.ios[0];

      await iap.requestPurchase({
        request: Platform.OS === 'android'
          ? { google: { skus: [productId] } }
          : { apple: { sku: productId } },
        type: 'subs',
      });

      return {
        success: true,
        message: 'Purchase initiated successfully',
      };
    } catch (error: any) {
      console.error('[PaymentService] Purchase error:', error);

      if (error.code === 'E_USER_CANCELLED') {
        return {
          success: false,
          message: 'Purchase cancelled by user',
          error: 'cancelled',
        };
      }

      return {
        success: false,
        message: error.message || 'Purchase failed',
        error: error.code || 'unknown',
      };
    }
  }

  async purchaseProductAnnual(): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const iap = await getIAP();
      if (!iap) {
        return {
          success: false,
          message: 'In-app purchases are not available in Expo Go. Please use a development build.',
          error: 'iap_unavailable',
        };
      }

      const productId = Platform.OS === 'android'
        ? ANNUAL_PRODUCT_IDS.android[0]
        : ANNUAL_PRODUCT_IDS.ios[0];

      await iap.requestPurchase({
        request: Platform.OS === 'android'
          ? { google: { skus: [productId] } }
          : { apple: { sku: productId } },
        type: 'subs',
      });

      return {
        success: true,
        message: 'Purchase initiated successfully',
      };
    } catch (error: any) {
      console.error('[PaymentService] Purchase error:', error);

      if (error.code === 'E_USER_CANCELLED') {
        return {
          success: false,
          message: 'Purchase cancelled by user',
          error: 'cancelled',
        };
      }

      return {
        success: false,
        message: error.message || 'Purchase failed',
        error: error.code || 'unknown',
      };
    }
  }

  private async verifyAndFinalizePurchase(
    purchase: Purchase
  ): Promise<void> {
    try {
      const purchaseToken = purchase.purchaseToken;

      if (!purchaseToken) {
        throw new Error('No purchase token found');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/upgrade-to-premium`;
      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

      const body = JSON.stringify({
        purchaseToken,
        productId: purchase.productId,
        platform: Platform.OS,
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        const iap = await getIAP();
        if (iap) {
          await iap.finishTransaction({ purchase, isConsumable: false });
        }
      } else {
        console.error('[PaymentService] Verification failed:', result.error);
        throw new Error(result.error || 'Verification failed');
      }
    } catch (error) {
      console.error('[PaymentService] Verification error:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const iap = await getIAP();
      if (!iap) {
        return {
          success: false,
          message: 'Restore purchases is not available in Expo Go. Please use a development build.',
          error: 'iap_unavailable',
        };
      }

      const availablePurchases = await iap.getAvailablePurchases();

      if (availablePurchases.length === 0) {
        return {
          success: false,
          message: 'No purchases to restore',
          error: 'no_purchases',
        };
      }

      const premiumPurchase = availablePurchases.find(
        (p: Purchase) => MONTHLY_PRODUCT_IDS.android.includes(p.productId) || 
               MONTHLY_PRODUCT_IDS.ios.includes(p.productId) ||
               ANNUAL_PRODUCT_IDS.android.includes(p.productId) ||
               ANNUAL_PRODUCT_IDS.ios.includes(p.productId)
      );

      if (!premiumPurchase) {
        return {
          success: false,
          message: 'No premium purchase found',
          error: 'no_premium_purchase',
        };
      }

      await this.verifyAndFinalizePurchase(premiumPurchase);

      return {
        success: true,
        message: 'Purchases restored successfully',
        purchase: premiumPurchase,
      };
    } catch (error: any) {
      console.error('[PaymentService] Restore error:', error);
      return {
        success: false,
        message: error.message || 'Failed to restore purchases',
        error: error.code || 'unknown',
      };
    }
  }

  async cleanup(): Promise<void> {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }

    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }

    if (this.isInitialized) {
      const iap = await getIAP();
      if (iap) {
        await iap.endConnection();
      }
      this.isInitialized = false;
    }
  }
}

export const paymentService = new PaymentService();
