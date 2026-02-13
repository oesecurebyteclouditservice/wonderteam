/**
 * Service de validation de la synchronisation des données Frontend/Backend
 * Garantit que les modifications faites sur le Frontend sont bien persistées dans le Backend
 */

import { supabase } from './supabase';
import { Product, Client, Order, Profile } from '../types';

export interface SyncValidationResult {
  timestamp: string;
  isValid: boolean;
  summary: {
    products: SyncStatus;
    clients: SyncStatus;
    orders: SyncStatus;
    profile: SyncStatus;
  };
  details: {
    products: SyncDetail[];
    clients: SyncDetail[];
    orders: SyncDetail[];
    profile: SyncDetail[];
  };
  errors: string[];
}

interface SyncStatus {
  synced: boolean;
  frontendCount: number;
  backendCount: number;
  mismatches: number;
  missingInBackend: number;
  missingInFrontend: number;
}

interface SyncDetail {
  id: string;
  status: 'ok' | 'mismatch' | 'missing_backend' | 'missing_frontend';
  field?: string;
  frontendValue?: any;
  backendValue?: any;
  message?: string;
}

class DataSyncValidator {
  private static instance: DataSyncValidator;
  private enabled: boolean = false;

  private constructor() {}

  static getInstance(): DataSyncValidator {
    if (!DataSyncValidator.instance) {
      DataSyncValidator.instance = new DataSyncValidator();
    }
    return DataSyncValidator.instance;
  }

  /**
   * Active/désactive la validation automatique
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    try {
      localStorage.setItem('data_sync_validation_enabled', enabled.toString());
    } catch {}
  }

  isEnabled(): boolean {
    try {
      const stored = localStorage.getItem('data_sync_validation_enabled');
      return stored === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Valide la synchronisation complète
   */
  async validate(
    frontendData: {
      products?: Product[];
      clients?: Client[];
      orders?: Order[];
      profile?: Profile | null;
    }
  ): Promise<SyncValidationResult> {
    const result: SyncValidationResult = {
      timestamp: new Date().toISOString(),
      isValid: true,
      summary: {
        products: this.getEmptySyncStatus(),
        clients: this.getEmptySyncStatus(),
        orders: this.getEmptySyncStatus(),
        profile: this.getEmptySyncStatus()
      },
      details: {
        products: [],
        clients: [],
        orders: [],
        profile: []
      },
      errors: []
    };

    if (!supabase) {
      result.errors.push('Supabase client not initialized');
      result.isValid = false;
      return result;
    }

    try {
      // Vérifier l'authentification
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        result.errors.push('User not authenticated');
        result.isValid = false;
        return result;
      }

      // Valider Products
      if (frontendData.products) {
        const productsValidation = await this.validateProducts(frontendData.products, user.id);
        result.summary.products = productsValidation.status;
        result.details.products = productsValidation.details;
        if (!productsValidation.status.synced) result.isValid = false;
      }

      // Valider Clients
      if (frontendData.clients) {
        const clientsValidation = await this.validateClients(frontendData.clients, user.id);
        result.summary.clients = clientsValidation.status;
        result.details.clients = clientsValidation.details;
        if (!clientsValidation.status.synced) result.isValid = false;
      }

      // Valider Orders
      if (frontendData.orders) {
        const ordersValidation = await this.validateOrders(frontendData.orders, user.id);
        result.summary.orders = ordersValidation.status;
        result.details.orders = ordersValidation.details;
        if (!ordersValidation.status.synced) result.isValid = false;
      }

      // Valider Profile
      if (frontendData.profile) {
        const profileValidation = await this.validateProfile(frontendData.profile, user.id);
        result.summary.profile = profileValidation.status;
        result.details.profile = profileValidation.details;
        if (!profileValidation.status.synced) result.isValid = false;
      }

    } catch (error: any) {
      result.errors.push(`Validation error: ${error.message}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Valide les produits
   */
  private async validateProducts(frontendProducts: Product[], userId: string): Promise<{
    status: SyncStatus;
    details: SyncDetail[];
  }> {
    const details: SyncDetail[] = [];
    const status: SyncStatus = {
      synced: true,
      frontendCount: frontendProducts.length,
      backendCount: 0,
      mismatches: 0,
      missingInBackend: 0,
      missingInFrontend: 0
    };

    try {
      const { data: backendProducts, error } = await supabase!
        .from('products')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      status.backendCount = backendProducts?.length || 0;

      const frontendMap = new Map(frontendProducts.map(p => [p.id, p]));
      const backendMap = new Map((backendProducts || []).map(p => [p.id, p]));

      // Vérifier les produits présents dans le Frontend
      for (const product of frontendProducts) {
        const backendProduct = backendMap.get(product.id);

        if (!backendProduct) {
          status.missingInBackend++;
          status.synced = false;
          details.push({
            id: product.id,
            status: 'missing_backend',
            message: `Product "${product.name}" exists in frontend but not in backend`
          });
        } else {
          // Comparer les champs importants
          const fieldsToCheck = ['name', 'stock_total', 'stock_15ml', 'stock_30ml', 'stock_70ml', 'price_public'];
          for (const field of fieldsToCheck) {
            if (product[field] !== backendProduct[field]) {
              status.mismatches++;
              status.synced = false;
              details.push({
                id: product.id,
                status: 'mismatch',
                field,
                frontendValue: product[field],
                backendValue: backendProduct[field],
                message: `Field "${field}" mismatch for product "${product.name}"`
              });
            }
          }
        }
      }

      // Vérifier les produits présents uniquement dans le Backend
      for (const [id, backendProduct] of backendMap) {
        if (!frontendMap.has(id)) {
          status.missingInFrontend++;
          details.push({
            id,
            status: 'missing_frontend',
            message: `Product "${backendProduct.name}" exists in backend but not in frontend`
          });
        }
      }

    } catch (error: any) {
      status.synced = false;
      details.push({
        id: 'error',
        status: 'mismatch',
        message: `Error validating products: ${error.message}`
      });
    }

    return { status, details };
  }

  /**
   * Valide les clients
   */
  private async validateClients(frontendClients: Client[], userId: string): Promise<{
    status: SyncStatus;
    details: SyncDetail[];
  }> {
    const details: SyncDetail[] = [];
    const status: SyncStatus = {
      synced: true,
      frontendCount: frontendClients.length,
      backendCount: 0,
      mismatches: 0,
      missingInBackend: 0,
      missingInFrontend: 0
    };

    try {
      const { data: backendClients, error } = await supabase!
        .from('clients')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      status.backendCount = backendClients?.length || 0;

      const frontendMap = new Map(frontendClients.map(c => [c.id, c]));
      const backendMap = new Map((backendClients || []).map(c => [c.id, c]));

      // Vérifier les clients présents dans le Frontend
      for (const client of frontendClients) {
        const backendClient = backendMap.get(client.id);

        if (!backendClient) {
          status.missingInBackend++;
          status.synced = false;
          details.push({
            id: client.id,
            status: 'missing_backend',
            message: `Client "${client.full_name}" exists in frontend but not in backend`
          });
        } else {
          // Comparer les champs importants
          const fieldsToCheck = ['full_name', 'email', 'phone'];
          for (const field of fieldsToCheck) {
            if (client[field] !== backendClient[field]) {
              status.mismatches++;
              status.synced = false;
              details.push({
                id: client.id,
                status: 'mismatch',
                field,
                frontendValue: client[field],
                backendValue: backendClient[field],
                message: `Field "${field}" mismatch for client "${client.full_name}"`
              });
            }
          }
        }
      }

      // Vérifier les clients présents uniquement dans le Backend
      for (const [id, backendClient] of backendMap) {
        if (!frontendMap.has(id)) {
          status.missingInFrontend++;
          details.push({
            id,
            status: 'missing_frontend',
            message: `Client "${backendClient.full_name}" exists in backend but not in frontend`
          });
        }
      }

    } catch (error: any) {
      status.synced = false;
      details.push({
        id: 'error',
        status: 'mismatch',
        message: `Error validating clients: ${error.message}`
      });
    }

    return { status, details };
  }

  /**
   * Valide les commandes
   */
  private async validateOrders(frontendOrders: Order[], userId: string): Promise<{
    status: SyncStatus;
    details: SyncDetail[];
  }> {
    const details: SyncDetail[] = [];
    const status: SyncStatus = {
      synced: true,
      frontendCount: frontendOrders.length,
      backendCount: 0,
      mismatches: 0,
      missingInBackend: 0,
      missingInFrontend: 0
    };

    try {
      const { data: backendOrders, error } = await supabase!
        .from('orders')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      status.backendCount = backendOrders?.length || 0;

      const frontendMap = new Map(frontendOrders.map(o => [o.id, o]));
      const backendMap = new Map((backendOrders || []).map(o => [o.id, o]));

      // Vérifier les commandes présentes dans le Frontend
      for (const order of frontendOrders) {
        const backendOrder = backendMap.get(order.id);

        if (!backendOrder) {
          status.missingInBackend++;
          status.synced = false;
          details.push({
            id: order.id,
            status: 'missing_backend',
            message: `Order "${order.id}" exists in frontend but not in backend`
          });
        } else {
          // Comparer les champs importants
          const fieldsToCheck = ['total_amount', 'profit', 'status', 'payment_status'];
          for (const field of fieldsToCheck) {
            if (order[field] !== backendOrder[field]) {
              status.mismatches++;
              status.synced = false;
              details.push({
                id: order.id,
                status: 'mismatch',
                field,
                frontendValue: order[field],
                backendValue: backendOrder[field],
                message: `Field "${field}" mismatch for order "${order.id}"`
              });
            }
          }
        }
      }

      // Vérifier les commandes présentes uniquement dans le Backend
      for (const [id, backendOrder] of backendMap) {
        if (!frontendMap.has(id)) {
          status.missingInFrontend++;
          details.push({
            id,
            status: 'missing_frontend',
            message: `Order "${id}" exists in backend but not in frontend`
          });
        }
      }

    } catch (error: any) {
      status.synced = false;
      details.push({
        id: 'error',
        status: 'mismatch',
        message: `Error validating orders: ${error.message}`
      });
    }

    return { status, details };
  }

  /**
   * Valide le profil
   */
  private async validateProfile(frontendProfile: Profile, userId: string): Promise<{
    status: SyncStatus;
    details: SyncDetail[];
  }> {
    const details: SyncDetail[] = [];
    const status: SyncStatus = {
      synced: true,
      frontendCount: 1,
      backendCount: 0,
      mismatches: 0,
      missingInBackend: 0,
      missingInFrontend: 0
    };

    try {
      const { data: backendProfile, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!backendProfile) {
        status.missingInBackend = 1;
        status.synced = false;
        details.push({
          id: userId,
          status: 'missing_backend',
          message: 'Profile exists in frontend but not in backend'
        });
      } else {
        status.backendCount = 1;

        // Comparer les champs importants
        const fieldsToCheck = ['full_name', 'email', 'team_name', 'sponsor'];
        for (const field of fieldsToCheck) {
          if (frontendProfile[field] !== backendProfile[field]) {
            status.mismatches++;
            status.synced = false;
            details.push({
              id: userId,
              status: 'mismatch',
              field,
              frontendValue: frontendProfile[field],
              backendValue: backendProfile[field],
              message: `Field "${field}" mismatch for profile`
            });
          }
        }
      }

    } catch (error: any) {
      status.synced = false;
      details.push({
        id: 'error',
        status: 'mismatch',
        message: `Error validating profile: ${error.message}`
      });
    }

    return { status, details };
  }

  private getEmptySyncStatus(): SyncStatus {
    return {
      synced: true,
      frontendCount: 0,
      backendCount: 0,
      mismatches: 0,
      missingInBackend: 0,
      missingInFrontend: 0
    };
  }

  /**
   * Génère un rapport lisible
   */
  generateReport(result: SyncValidationResult): string {
    let report = '=== DATA SYNC VALIDATION REPORT ===\n\n';
    report += `Timestamp: ${new Date(result.timestamp).toLocaleString('fr-FR')}\n`;
    report += `Overall Status: ${result.isValid ? '✅ SYNCED' : '❌ OUT OF SYNC'}\n\n`;

    if (result.errors.length > 0) {
      report += '🚨 ERRORS:\n';
      result.errors.forEach(err => {
        report += `  - ${err}\n`;
      });
      report += '\n';
    }

    const sections = ['products', 'clients', 'orders', 'profile'] as const;

    for (const section of sections) {
      const status = result.summary[section];
      const details = result.details[section];

      report += `\n${'='.repeat(50)}\n`;
      report += `${section.toUpperCase()}\n`;
      report += `${'='.repeat(50)}\n`;
      report += `Status: ${status.synced ? '✅ Synced' : '❌ Out of Sync'}\n`;
      report += `Frontend Count: ${status.frontendCount}\n`;
      report += `Backend Count: ${status.backendCount}\n`;
      report += `Mismatches: ${status.mismatches}\n`;
      report += `Missing in Backend: ${status.missingInBackend}\n`;
      report += `Missing in Frontend: ${status.missingInFrontend}\n`;

      if (details.length > 0) {
        report += '\nDetails:\n';
        details.forEach((detail, index) => {
          report += `  ${index + 1}. [${detail.status.toUpperCase()}] ${detail.message}\n`;
          if (detail.field) {
            report += `     Field: ${detail.field}\n`;
            report += `     Frontend: ${JSON.stringify(detail.frontendValue)}\n`;
            report += `     Backend: ${JSON.stringify(detail.backendValue)}\n`;
          }
        });
      }
    }

    return report;
  }

  /**
   * Exporte le rapport de validation
   */
  exportReport(result: SyncValidationResult, format: 'json' | 'text' = 'text'): void {
    const timestamp = Date.now();

    if (format === 'json') {
      const data = JSON.stringify(result, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-sync-report-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const data = this.generateReport(result);
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-sync-report-${timestamp}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}

export const dataSyncValidator = DataSyncValidator.getInstance();
