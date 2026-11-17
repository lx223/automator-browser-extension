import { useCallback } from 'react';
import type { Rule } from '@/utils/rule';
import * as ruleStorage from '@/services/ruleStorage';
import type { RuleInput } from '@/services/ruleStorage';

export function useRuleActions() {
  const createRule = useCallback((rule: RuleInput) => ruleStorage.addRule(rule), []);

  const updateRule = useCallback((id: string, updates: Partial<Rule>) => ruleStorage.updateRule(id, updates), []);

  const deleteRule = useCallback((id: string) => ruleStorage.deleteRule(id), []);

  const toggleRule = useCallback((id: string) => ruleStorage.toggleRule(id), []);

  return {
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
}
