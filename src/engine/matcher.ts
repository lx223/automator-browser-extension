import {
  ActionType,
  ConditionOperator,
  ConditionType,
  JoinOperator,
  SubjectMatchField,
  SubjectMatchOperator,
  TimeUnit,
} from '@/utils/rule';
import type { ConditionMatcher, Rule, Subject, SubjectMatcher } from '@/utils/rule';

export type BrowserTab = chrome.tabs.Tab;

export interface EvaluationContext {
  now: number;
  createdAt: Record<number, number>;
  excludeUrlPrefix?: string;
}

const MINUTE_MS = 60 * 1000;

function normalizeDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^www\./, '');
}

function getDomain(url: string | undefined): string {
  if (!url) {
    return '';
  }
  try {
    return normalizeDomain(new URL(url).hostname);
  } catch {
    return '';
  }
}

function matchesSubjectMatcher(tab: BrowserTab, matcher: SubjectMatcher): boolean {
  const isDomain = matcher.field === SubjectMatchField.DOMAIN;
  let actual: string;
  switch (matcher.field) {
    case SubjectMatchField.URL:
      actual = tab.url ?? tab.pendingUrl ?? '';
      break;
    case SubjectMatchField.TITLE:
      actual = tab.title ?? '';
      break;
    case SubjectMatchField.DOMAIN:
      actual = getDomain(tab.url ?? tab.pendingUrl);
      break;
    default:
      return false;
  }

  if (matcher.operator === SubjectMatchOperator.REGEX) {
    try {
      return new RegExp(matcher.value, 'i').test(actual);
    } catch {
      return false;
    }
  }

  const haystack = actual.toLowerCase();
  const needle = isDomain ? normalizeDomain(matcher.value) : matcher.value.toLowerCase();
  switch (matcher.operator) {
    case SubjectMatchOperator.CONTAINS:
      return haystack.includes(needle);
    case SubjectMatchOperator.EQUALS:
      return haystack === needle;
    case SubjectMatchOperator.STARTS_WITH:
      return haystack.startsWith(needle);
    case SubjectMatchOperator.ENDS_WITH:
      return haystack.endsWith(needle);
    default:
      return false;
  }
}

export function matchesSubject(tab: BrowserTab, subject: Subject | undefined): boolean {
  if (!subject || subject.matchers.length === 0) {
    return true;
  }
  if (subject.joinOperator === JoinOperator.OR) {
    return subject.matchers.some((matcher) => matchesSubjectMatcher(tab, matcher));
  }
  return subject.matchers.every((matcher) => matchesSubjectMatcher(tab, matcher));
}

export function compare(actual: number, operator: ConditionOperator, expected: number): boolean {
  switch (operator) {
    case ConditionOperator.GREATER_THAN:
      return actual > expected;
    case ConditionOperator.LESS_THAN:
      return actual < expected;
    case ConditionOperator.EQUALS:
      return actual === expected;
    case ConditionOperator.GREATER_THAN_OR_EQUALS:
      return actual >= expected;
    case ConditionOperator.LESS_THAN_OR_EQUALS:
      return actual <= expected;
    default:
      return false;
  }
}

export function toMilliseconds(value: number, unit: TimeUnit): number {
  switch (unit) {
    case TimeUnit.MINUTES:
      return value * MINUTE_MS;
    case TimeUnit.HOURS:
      return value * 60 * MINUTE_MS;
    case TimeUnit.DAYS:
      return value * 24 * 60 * MINUTE_MS;
    default:
      return value * MINUTE_MS;
  }
}

function getAge(tab: BrowserTab, context: EvaluationContext): number {
  const created = context.createdAt[tab.id!];
  return created === undefined ? 0 : Math.max(0, context.now - created);
}

function getInactiveDuration(tab: BrowserTab, context: EvaluationContext): number {
  if (tab.active) {
    return 0;
  }
  const lastActive = tab.lastAccessed ?? context.createdAt[tab.id!];
  return lastActive === undefined ? 0 : Math.max(0, context.now - lastActive);
}

function compareDuration(duration: number, matcher: ConditionMatcher): boolean {
  const threshold = toMilliseconds(matcher.value, matcher.timeUnit);
  if (matcher.operator === ConditionOperator.EQUALS) {
    return Math.floor(duration / MINUTE_MS) === Math.floor(threshold / MINUTE_MS);
  }
  return compare(duration, matcher.operator, threshold);
}

function leastRecentlyUsedFirst(tabs: BrowserTab[]): BrowserTab[] {
  return [...tabs].sort((a, b) => {
    if (a.active !== b.active) {
      return a.active ? 1 : -1;
    }
    if (a.pinned !== b.pinned) {
      return a.pinned ? 1 : -1;
    }
    return (a.lastAccessed ?? 0) - (b.lastAccessed ?? 0) || a.id! - b.id!;
  });
}

function selectByCount(tabs: BrowserTab[], matcher: ConditionMatcher, excessOnly: boolean): BrowserTab[] {
  if (!compare(tabs.length, matcher.operator, matcher.value)) {
    return [];
  }
  const trimsExcess =
    excessOnly &&
    (matcher.operator === ConditionOperator.GREATER_THAN ||
      matcher.operator === ConditionOperator.GREATER_THAN_OR_EQUALS);
  if (!trimsExcess) {
    return tabs;
  }
  const keep = matcher.operator === ConditionOperator.GREATER_THAN ? matcher.value : matcher.value - 1;
  const excess = Math.min(tabs.length, Math.max(0, tabs.length - Math.max(0, keep)));
  return leastRecentlyUsedFirst(tabs).slice(0, excess);
}

function selectDuplicates(tabs: BrowserTab[], context: EvaluationContext): BrowserTab[] {
  const byUrl = new Map<string, BrowserTab[]>();
  for (const tab of tabs) {
    const url = tab.url ?? tab.pendingUrl;
    if (!url) {
      continue;
    }
    byUrl.set(url, [...(byUrl.get(url) ?? []), tab]);
  }

  const duplicates: BrowserTab[] = [];
  for (const group of byUrl.values()) {
    if (group.length < 2) {
      continue;
    }
    const ranked = [...group].sort((a, b) => {
      if (a.active !== b.active) {
        return a.active ? -1 : 1;
      }
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }
      const createdA = context.createdAt[a.id!] ?? context.now;
      const createdB = context.createdAt[b.id!] ?? context.now;
      return createdA - createdB || a.id! - b.id!;
    });
    duplicates.push(...ranked.slice(1));
  }
  return duplicates;
}

function selectByConditionMatcher(
  tabs: BrowserTab[],
  matcher: ConditionMatcher,
  context: EvaluationContext,
  excessOnly: boolean
): BrowserTab[] {
  switch (matcher.type) {
    case ConditionType.TAB_AGE:
      return tabs.filter((tab) => compareDuration(getAge(tab, context), matcher));
    case ConditionType.TAB_INACTIVE_DURATION:
      return tabs.filter((tab) => compareDuration(getInactiveDuration(tab, context), matcher));
    case ConditionType.TAB_COUNT_EXCEEDS:
      return selectByCount(tabs, matcher, excessOnly);
    case ConditionType.TAB_DUPLICATE:
      return selectDuplicates(tabs, context);
    default:
      return [];
  }
}

function isDestructive(rule: Rule): boolean {
  const actions = rule.action?.matchers ?? [];
  return actions.length > 0 && actions.every((action) => action.type === ActionType.CLOSE || action.type === ActionType.DISCARD);
}

export function selectTabs(rule: Rule, tabs: BrowserTab[], context: EvaluationContext): BrowserTab[] {
  const candidates = tabs.filter((tab) => {
    if (tab.id === undefined || tab.id === chrome.tabs.TAB_ID_NONE) {
      return false;
    }
    if (context.excludeUrlPrefix && (tab.url ?? tab.pendingUrl ?? '').startsWith(context.excludeUrlPrefix)) {
      return false;
    }
    return matchesSubject(tab, rule.subject);
  });

  const matchers = rule.condition?.matchers ?? [];
  if (matchers.length === 0) {
    return candidates;
  }

  const excessOnly = isDestructive(rule);
  const selections = matchers.map(
    (matcher) => new Set(selectByConditionMatcher(candidates, matcher, context, excessOnly).map((tab) => tab.id!))
  );
  const useOr = rule.condition?.joinOperator === JoinOperator.OR;
  return candidates.filter((tab) =>
    useOr ? selections.some((ids) => ids.has(tab.id!)) : selections.every((ids) => ids.has(tab.id!))
  );
}
