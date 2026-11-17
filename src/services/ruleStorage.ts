import type { Rule } from '@/utils/rule';
import { generateRuleId } from '@/utils/rule';

export const RULES_STORAGE_KEY = 'rules';

export type RuleInput = Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>;

export async function loadRules(): Promise<Rule[]> {
  const result = await chrome.storage.local.get(RULES_STORAGE_KEY);
  const stored = (result as Record<string, unknown>)[RULES_STORAGE_KEY];
  return Array.isArray(stored) ? (stored as Rule[]) : [];
}

export async function saveRules(rules: Rule[]): Promise<void> {
  await chrome.storage.local.set({ [RULES_STORAGE_KEY]: rules });
}

export async function addRule(input: RuleInput): Promise<Rule> {
  const now = Date.now();
  const rule: Rule = { ...input, id: generateRuleId(), createdAt: now, updatedAt: now };
  const rules = await loadRules();
  await saveRules([...rules, rule]);
  return rule;
}

export async function updateRule(id: string, updates: Partial<Rule>): Promise<Rule | undefined> {
  const rules = await loadRules();
  const existing = rules.find((rule) => rule.id === id);
  if (!existing) {
    return undefined;
  }
  const updated: Rule = { ...existing, ...updates, id, createdAt: existing.createdAt, updatedAt: Date.now() };
  await saveRules(rules.map((rule) => (rule.id === id ? updated : rule)));
  return updated;
}

export async function deleteRule(id: string): Promise<void> {
  const rules = await loadRules();
  await saveRules(rules.filter((rule) => rule.id !== id));
}

export async function toggleRule(id: string): Promise<Rule | undefined> {
  const rules = await loadRules();
  const existing = rules.find((rule) => rule.id === id);
  if (!existing) {
    return undefined;
  }
  return updateRule(id, { enabled: !existing.enabled });
}

export function subscribeToRules(listener: (rules: Rule[]) => void): () => void {
  const handler = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
    if (areaName !== 'local' || !(RULES_STORAGE_KEY in changes)) {
      return;
    }
    const next = changes[RULES_STORAGE_KEY].newValue;
    listener(Array.isArray(next) ? (next as Rule[]) : []);
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
