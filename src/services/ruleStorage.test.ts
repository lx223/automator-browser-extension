import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockLocalStorage } from '@/setupTests';
import { ActionType, createAction, createActionMatcher } from '@/utils/rule';
import { addRule, deleteRule, loadRules, subscribeToRules, toggleRule, updateRule } from './ruleStorage';

const input = {
  name: 'Close docs',
  enabled: true,
  action: createAction({ matchers: [createActionMatcher({ type: ActionType.CLOSE })] }),
};

describe('ruleStorage', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('returns an empty list when nothing is stored', async () => {
    expect(await loadRules()).toEqual([]);
  });

  it('persists a new rule with an id and timestamps', async () => {
    const rule = await addRule(input);

    expect(rule.id).toMatch(/^rule_/);
    expect(rule.createdAt).toBeTypeOf('number');
    expect(await loadRules()).toEqual([rule]);
  });

  it('updates an existing rule without changing its id', async () => {
    const rule = await addRule(input);

    const updated = await updateRule(rule.id, { name: 'Renamed', id: 'other' });

    expect(updated?.id).toBe(rule.id);
    expect((await loadRules())[0].name).toBe('Renamed');
  });

  it('returns undefined when updating a missing rule', async () => {
    expect(await updateRule('missing', { name: 'x' })).toBeUndefined();
  });

  it('toggles the enabled flag', async () => {
    const rule = await addRule(input);

    await toggleRule(rule.id);
    expect((await loadRules())[0].enabled).toBe(false);

    await toggleRule(rule.id);
    expect((await loadRules())[0].enabled).toBe(true);
  });

  it('deletes a rule', async () => {
    const first = await addRule(input);
    const second = await addRule({ ...input, name: 'Second' });

    await deleteRule(first.id);

    expect(await loadRules()).toEqual([second]);
  });

  it('notifies subscribers until they unsubscribe', async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToRules(listener);

    const rule = await addRule(input);
    expect(listener).toHaveBeenLastCalledWith([rule]);

    unsubscribe();
    listener.mockClear();
    await deleteRule(rule.id);
    expect(listener).not.toHaveBeenCalled();
  });
});
