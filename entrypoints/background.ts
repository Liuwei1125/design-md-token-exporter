import { buildDesignSnapshot, collectRawPageAnalysis } from '../src/analyzer/pageAnalyzer';
import { ANALYZE_CURRENT_PAGE, LAST_SNAPSHOT_STORAGE_KEY, type AnalyzeCurrentPageResponse } from '../src/messages';
import { setStoredValue } from '../src/store/storage';

export function setupBackground() {
  chrome.runtime.onInstalled.addListener(() => {
    if (chrome.sidePanel?.setPanelBehavior) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== ANALYZE_CURRENT_PAGE) {
      return false;
    }

    analyzeActiveTab()
      .then((response) => sendResponse(response))
      .catch((error: unknown) => {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : 'Failed to analyze the current page',
        } satisfies AnalyzeCurrentPageResponse);
      });

    return true;
  });
}

export default defineBackground(setupBackground);

async function analyzeActiveTab(): Promise<AnalyzeCurrentPageResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab?.id === undefined) {
    return {
      ok: false,
      error: 'No active tab found',
    };
  }

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: collectRawPageAnalysis,
  });

  if (!result?.result) {
    return {
      ok: false,
      error: 'The page did not return an analysis snapshot',
    };
  }

  const snapshot = buildDesignSnapshot(result.result);

  await setStoredValue(LAST_SNAPSHOT_STORAGE_KEY, snapshot);

  return {
    ok: true,
    snapshot,
  };
}
