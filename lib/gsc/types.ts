export interface GscQueryPerformance {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscSyncOptions {
  siteUrl?: string;
  startDate?: string;
  endDate?: string;
  rowLimit?: number;
}

export interface GscSyncResult {
  success: boolean;
  importedRows: number;
  opportunitiesDetected: number;
  startDate: string;
  endDate: string;
  durationMs: number;
  isMock: boolean;
  error?: string;
}

export interface GscSummaryStats {
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  topQueriesCount: number;
  strikingDistanceCount: number;
  lowCtrCount: number;
}
