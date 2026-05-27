import type { DesignSnapshot } from './analyzer/types';

export const ANALYZE_CURRENT_PAGE = 'ANALYZE_CURRENT_PAGE';
export const LAST_SNAPSHOT_STORAGE_KEY = 'lastSnapshot';
export const USER_CORRECTIONS_STORAGE_KEY = 'userCorrections';

export type AnalyzeCurrentPageMessage = {
  type: typeof ANALYZE_CURRENT_PAGE;
};

export type RuntimeMessage = AnalyzeCurrentPageMessage;

export type AnalyzeCurrentPageResponse =
  | {
      ok: true;
      snapshot: DesignSnapshot;
    }
  | {
      ok: false;
      error: string;
    };
