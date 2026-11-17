import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockLocalStorage, mockSessionStorage } from '@/setupTests';
import { addRule } from '@/services/ruleStorage';
import {
  ActionType,
  ConditionOperator,
  ConditionType,
  SubjectMatchField,
  SubjectMatchOperator,
  TimeUnit,
  createAction,
  createActionMatcher,
  createCondition,
  createConditionMatcher,
  createSubject,
  createSubjectMatcher,
} from '@/utils/rule';
import { TAB_CREATED_AT_KEY, runRules } from './runner';
import { makeTab, resetTabIds } from './testUtils';

const tabsApi = vi.mocked(chrome.tabs);

const closeAction = createAction({ matchers: [createActionMatcher({ type: ActionType.CLOSE })] });

describe('runRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    resetTabIds();
    tabsApi.remove.mockResolvedValue(undefined as never);
  });

  it('applies enabled rules to matching tabs and skips disabled rules', async () => {
    tabsApi.query.mockResolvedValue([makeTab({ url: 'https://news.com/a' }), makeTab({ url: 'https://docs.com/b' })] as never);
    const enabled = await addRule({
      name: 'Close news',
      enabled: true,
      subject: createSubject({
        matchers: [createSubjectMatcher({ field: SubjectMatchField.DOMAIN, operator: SubjectMatchOperator.EQUALS, value: 'news.com' })],
      }),
      action: closeAction,
    });
    await addRule({ name: 'Close everything', enabled: false, action: closeAction });

    const results = await runRules();

    expect(results).toEqual([{ ruleId: enabled.id, affected: 1 }]);
    expect(tabsApi.remove).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('never acts on the extension page', async () => {
    tabsApi.query.mockResolvedValue([makeTab({ url: chrome.runtime.getURL('index.html') })] as never);
    await addRule({ name: 'Close everything', enabled: true, action: closeAction });

    await runRules();

    expect(tabsApi.remove).not.toHaveBeenCalled();
  });

  it('tracks tab creation times across runs to evaluate tab age', async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(1_000_000);
      tabsApi.query.mockResolvedValue([makeTab()] as never);
      await addRule({
        name: 'Close old tabs',
        enabled: true,
        condition: createCondition({
          matchers: [
            createConditionMatcher({
              type: ConditionType.TAB_AGE,
              operator: ConditionOperator.GREATER_THAN,
              value: 10,
              timeUnit: TimeUnit.MINUTES,
            }),
          ],
        }),
        action: closeAction,
      });

      await runRules();
      expect(tabsApi.remove).not.toHaveBeenCalled();
      expect(await chrome.storage.session.get(TAB_CREATED_AT_KEY)).toEqual({ [TAB_CREATED_AT_KEY]: { 1: 1_000_000 } });

      vi.setSystemTime(1_000_000 + 11 * 60 * 1000);
      await runRules();
      expect(tabsApi.remove).toHaveBeenCalledExactlyOnceWith(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('forgets creation times of tabs that no longer exist', async () => {
    tabsApi.query.mockResolvedValue([makeTab(), makeTab()] as never);
    await runRules();

    tabsApi.query.mockResolvedValue([makeTab({ id: 2 })] as never);
    await runRules();

    const stored = (await chrome.storage.session.get(TAB_CREATED_AT_KEY)) as Record<string, Record<number, number>>;
    expect(Object.keys(stored[TAB_CREATED_AT_KEY])).toEqual(['2']);
  });
});
