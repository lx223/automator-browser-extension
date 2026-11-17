import type { BrowserTab } from './matcher';

let nextId = 1;

export function resetTabIds(): void {
  nextId = 1;
}

export function makeTab(overrides: Partial<BrowserTab> = {}): BrowserTab {
  const id = overrides.id ?? nextId++;
  return {
    id,
    index: id,
    windowId: 1,
    groupId: -1,
    url: `https://example.com/${id}`,
    title: `Tab ${id}`,
    active: false,
    pinned: false,
    highlighted: false,
    incognito: false,
    selected: false,
    discarded: false,
    autoDiscardable: true,
    frozen: false,
    ...overrides,
  } as BrowserTab;
}
