import { loadRules } from '@/services/ruleStorage';
import { ActionType } from '@/utils/rule';
import { executeAction } from './actions';
import { selectTabs } from './matcher';
import type { BrowserTab } from './matcher';

export const TAB_CREATED_AT_KEY = 'tabCreatedAt';
export const RUN_RULES_MESSAGE = 'RUN_RULES_MANUALLY';

export interface RuleRunResult {
  ruleId: string;
  affected: number;
}

async function syncTabCreationTimes(tabs: BrowserTab[], now: number): Promise<Record<number, number>> {
  const result = await chrome.storage.session.get(TAB_CREATED_AT_KEY);
  const stored = ((result as Record<string, unknown>)[TAB_CREATED_AT_KEY] ?? {}) as Record<number, number>;
  const next: Record<number, number> = {};
  let changed = false;

  for (const tab of tabs) {
    if (tab.id === undefined) {
      continue;
    }
    if (stored[tab.id] === undefined) {
      changed = true;
      next[tab.id] = now;
    } else {
      next[tab.id] = stored[tab.id];
    }
  }

  if (changed || Object.keys(stored).length !== Object.keys(next).length) {
    await chrome.storage.session.set({ [TAB_CREATED_AT_KEY]: next });
  }
  return next;
}

async function executeRun(): Promise<RuleRunResult[]> {
  const now = Date.now();
  let tabs = await chrome.tabs.query({});
  const createdAt = await syncTabCreationTimes(tabs, now);
  const rules = (await loadRules()).filter((rule) => rule.enabled);
  const excludeUrlPrefix = chrome.runtime.getURL('');
  const results: RuleRunResult[] = [];

  for (const rule of rules) {
    let selected = selectTabs(rule, tabs, { now, createdAt, excludeUrlPrefix });
    let affected = 0;
    for (const action of rule.action?.matchers ?? []) {
      if (selected.length === 0) {
        break;
      }
      affected += await executeAction(action, selected);
      if (action.type === ActionType.CLOSE) {
        selected = [];
      }
    }
    results.push({ ruleId: rule.id, affected });
    if (affected > 0) {
      tabs = await chrome.tabs.query({});
    }
  }
  return results;
}

let pending: Promise<unknown> = Promise.resolve();
let queued = false;

export function runRules(): Promise<RuleRunResult[]> {
  const run = pending.then(() => executeRun());
  pending = run.catch(() => undefined);
  return run;
}

export function requestRun(): void {
  if (queued) {
    return;
  }
  queued = true;
  pending = pending
    .then(() => {
      queued = false;
      return executeRun();
    })
    .catch((error) => {
      queued = false;
      console.error('Rules run failed', error);
    });
}
