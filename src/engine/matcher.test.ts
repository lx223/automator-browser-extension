import { beforeEach, describe, expect, it } from 'vitest';
import {
  ActionType,
  ConditionOperator,
  ConditionType,
  JoinOperator,
  SubjectMatchField,
  SubjectMatchOperator,
  TimeUnit,
  createAction,
  createActionMatcher,
  createCondition,
  createConditionMatcher,
  createRule,
  createSubject,
  createSubjectMatcher,
} from '@/utils/rule';
import type { Rule } from '@/utils/rule';
import { matchesSubject, selectTabs } from './matcher';
import { makeTab, resetTabIds } from './testUtils';

const NOW = 1_000_000_000;
const HOUR = 60 * 60 * 1000;

function subjectOf(field: SubjectMatchField, operator: SubjectMatchOperator, value: string) {
  return createSubject({ matchers: [createSubjectMatcher({ field, operator, value })] });
}

function ruleWith(
  condition: Parameters<typeof createConditionMatcher>[0] | undefined,
  actionType: ActionType = ActionType.CLOSE,
  subject = createSubject()
): Rule {
  return createRule({
    subject,
    condition: condition ? createCondition({ matchers: [createConditionMatcher(condition)] }) : undefined,
    action: createAction({ matchers: [createActionMatcher({ type: actionType })] }),
  });
}

function ids(tabs: chrome.tabs.Tab[]) {
  return tabs.map((tab) => tab.id);
}

describe('matchesSubject', () => {
  const tab = makeTab({ id: 50, url: 'https://www.YouTube.com/watch?v=1', title: 'Funny Cats' });

  it('matches everything when there are no matchers', () => {
    expect(matchesSubject(tab, undefined)).toBe(true);
    expect(matchesSubject(tab, createSubject())).toBe(true);
  });

  it('matches URL case-insensitively', () => {
    expect(matchesSubject(tab, subjectOf(SubjectMatchField.URL, SubjectMatchOperator.CONTAINS, 'youtube.com/WATCH'))).toBe(true);
    expect(matchesSubject(tab, subjectOf(SubjectMatchField.URL, SubjectMatchOperator.STARTS_WITH, 'https://www.youtube'))).toBe(true);
    expect(matchesSubject(tab, subjectOf(SubjectMatchField.URL, SubjectMatchOperator.ENDS_WITH, 'v=2'))).toBe(false);
  });

  it('matches title', () => {
    expect(matchesSubject(tab, subjectOf(SubjectMatchField.TITLE, SubjectMatchOperator.EQUALS, 'funny cats'))).toBe(true);
    expect(matchesSubject(tab, subjectOf(SubjectMatchField.TITLE, SubjectMatchOperator.EQUALS, 'funny'))).toBe(false);
  });

  it('matches domain ignoring a www prefix', () => {
    expect(matchesSubject(tab, subjectOf(SubjectMatchField.DOMAIN, SubjectMatchOperator.EQUALS, 'youtube.com'))).toBe(true);
    expect(matchesSubject(tab, subjectOf(SubjectMatchField.DOMAIN, SubjectMatchOperator.EQUALS, 'www.youtube.com'))).toBe(true);
    expect(matchesSubject(tab, subjectOf(SubjectMatchField.DOMAIN, SubjectMatchOperator.EQUALS, 'tube.com'))).toBe(false);
  });

  it('matches regex and treats an invalid pattern as no match', () => {
    expect(matchesSubject(tab, subjectOf(SubjectMatchField.URL, SubjectMatchOperator.REGEX, 'watch\\?v=\\d+$'))).toBe(true);
    expect(matchesSubject(tab, subjectOf(SubjectMatchField.URL, SubjectMatchOperator.REGEX, '('))).toBe(false);
  });

  it('combines matchers with AND or OR', () => {
    const matchers = [
      createSubjectMatcher({ field: SubjectMatchField.DOMAIN, operator: SubjectMatchOperator.EQUALS, value: 'youtube.com' }),
      createSubjectMatcher({ field: SubjectMatchField.TITLE, operator: SubjectMatchOperator.CONTAINS, value: 'dogs' }),
    ];
    expect(matchesSubject(tab, createSubject({ matchers, joinOperator: JoinOperator.AND }))).toBe(false);
    expect(matchesSubject(tab, createSubject({ matchers, joinOperator: JoinOperator.OR }))).toBe(true);
  });
});

describe('selectTabs', () => {
  beforeEach(() => {
    resetTabIds();
  });

  it('returns all subject matches when there is no condition', () => {
    const tabs = [makeTab({ url: 'https://a.com/' }), makeTab({ url: 'https://b.com/' })];
    const rule = ruleWith(undefined, ActionType.PIN, subjectOf(SubjectMatchField.DOMAIN, SubjectMatchOperator.EQUALS, 'a.com'));

    expect(ids(selectTabs(rule, tabs, { now: NOW, createdAt: {} }))).toEqual([1]);
  });

  it('excludes the extension page and tabs without an id', () => {
    const tabs = [
      makeTab({ url: 'chrome-extension://abc/index.html' }),
      makeTab({ id: chrome.tabs.TAB_ID_NONE }),
      makeTab({ id: 7 }),
    ];

    const selected = selectTabs(ruleWith(undefined), tabs, { now: NOW, createdAt: {}, excludeUrlPrefix: 'chrome-extension://abc/' });

    expect(ids(selected)).toEqual([7]);
  });

  it('selects tabs older than the age threshold', () => {
    const tabs = [makeTab(), makeTab(), makeTab()];
    const createdAt = { 1: NOW - 5 * HOUR, 2: NOW - 3 * HOUR };
    const rule = ruleWith({
      type: ConditionType.TAB_AGE,
      operator: ConditionOperator.GREATER_THAN,
      value: 4,
      timeUnit: TimeUnit.HOURS,
    });

    expect(ids(selectTabs(rule, tabs, { now: NOW, createdAt }))).toEqual([1]);
  });

  it('selects tabs by inactive duration and never the active tab', () => {
    const tabs = [
      makeTab({ lastAccessed: NOW - 45 * 60 * 1000 }),
      makeTab({ lastAccessed: NOW - 10 * 60 * 1000 }),
      makeTab({ lastAccessed: NOW - 90 * 60 * 1000, active: true }),
    ];
    const rule = ruleWith({
      type: ConditionType.TAB_INACTIVE_DURATION,
      operator: ConditionOperator.GREATER_THAN_OR_EQUALS,
      value: 30,
      timeUnit: TimeUnit.MINUTES,
    });

    expect(ids(selectTabs(rule, tabs, { now: NOW, createdAt: {} }))).toEqual([1]);
  });

  it('selects only the least recently used excess tabs for close rules', () => {
    const tabs = [
      makeTab({ lastAccessed: 400 }),
      makeTab({ lastAccessed: 100 }),
      makeTab({ lastAccessed: 300, active: true }),
      makeTab({ lastAccessed: 200 }),
    ];
    const rule = ruleWith({ type: ConditionType.TAB_COUNT_EXCEEDS, operator: ConditionOperator.GREATER_THAN, value: 2 });

    expect(ids(selectTabs(rule, tabs, { now: NOW, createdAt: {} })).sort()).toEqual([2, 4]);
  });

  it('selects every matching tab for non-destructive count rules', () => {
    const tabs = [makeTab(), makeTab(), makeTab()];
    const rule = ruleWith(
      { type: ConditionType.TAB_COUNT_EXCEEDS, operator: ConditionOperator.GREATER_THAN, value: 2 },
      ActionType.MOVE_TO_GROUP
    );

    expect(ids(selectTabs(rule, tabs, { now: NOW, createdAt: {} }))).toEqual([1, 2, 3]);
  });

  it('selects nothing when the count condition is not met', () => {
    const tabs = [makeTab(), makeTab()];
    const rule = ruleWith({ type: ConditionType.TAB_COUNT_EXCEEDS, operator: ConditionOperator.GREATER_THAN, value: 2 });

    expect(selectTabs(rule, tabs, { now: NOW, createdAt: {} })).toEqual([]);
  });

  it('selects duplicates while keeping the active or oldest copy', () => {
    const tabs = [
      makeTab({ url: 'https://a.com/' }),
      makeTab({ url: 'https://a.com/', active: true }),
      makeTab({ url: 'https://b.com/' }),
      makeTab({ url: 'https://b.com/' }),
      makeTab({ url: 'https://c.com/' }),
    ];
    const createdAt = { 3: NOW - 10, 4: NOW - 20 };
    const rule = ruleWith({ type: ConditionType.TAB_DUPLICATE });

    expect(ids(selectTabs(rule, tabs, { now: NOW, createdAt })).sort()).toEqual([1, 3]);
  });

  it('combines condition matchers with OR', () => {
    const tabs = [makeTab({ url: 'https://a.com/' }), makeTab({ url: 'https://a.com/' }), makeTab({ url: 'https://b.com/' })];
    const rule = createRule({
      condition: createCondition({
        joinOperator: JoinOperator.OR,
        matchers: [
          createConditionMatcher({ type: ConditionType.TAB_DUPLICATE }),
          createConditionMatcher({
            type: ConditionType.TAB_AGE,
            operator: ConditionOperator.GREATER_THAN,
            value: 1,
            timeUnit: TimeUnit.HOURS,
          }),
        ],
      }),
      action: createAction({ matchers: [createActionMatcher({ type: ActionType.CLOSE })] }),
    });

    expect(ids(selectTabs(rule, tabs, { now: NOW, createdAt: { 1: NOW, 2: NOW, 3: NOW - 2 * HOUR } }))).toEqual([2, 3]);
  });
});
