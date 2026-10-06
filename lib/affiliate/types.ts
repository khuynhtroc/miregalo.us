export interface AffiliatePlatformConfig {
  id: 'amazon' | 'awin' | 'ebay' | 'walmart' | 'direct';
  name: string;
  tagOrId: string;
  domain: string;
  active: boolean;
  commissionRate: string;
  notes: string;
  targetWeight: number; // percentage in smart distribution, e.g. 50
}

export interface AffiliateSettings {
  platforms: Record<string, AffiliatePlatformConfig>;
  defaultStrategy: 'smart_distribution' | 'amazon_primary' | 'round_robin';
  lastSyncedAt?: string;
  lastSyncedItemsCount?: number;
}

export interface AffiliateSyncOptions {
  strategy?: 'smart_distribution' | 'amazon_only' | 'awin_only' | 'ebay_only' | 'walmart_only';
  customAmazonTag?: string;
  customAwinId?: string;
  customEbayCampId?: string;
  customWalmartId?: string;
  ensureGoRedirects?: boolean;
}

export interface AffiliateSyncResult {
  success: boolean;
  totalPostsProcessed: number;
  totalItemsSynced: number;
  platformCounts: {
    amazon: number;
    awin: number;
    ebay: number;
    walmart: number;
    direct: number;
  };
  redirectsCreatedOrUpdated: number;
  durationMs: number;
}
