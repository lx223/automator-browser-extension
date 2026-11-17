import { useCallback, useEffect, useState } from 'react';
import type { Rule } from '@/utils/rule';
import { loadRules, subscribeToRules } from '@/services/ruleStorage';

export function useRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshRules = useCallback(async () => {
    try {
      setRules(await loadRules());
    } catch (error) {
      console.error('Failed to load rules', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshRules();
    return subscribeToRules(setRules);
  }, [refreshRules]);

  return {
    rules,
    loading,
    refreshRules,
    setRules,
  };
}
