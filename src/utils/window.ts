export type { Window } from '@/generated/workspace_pb';
export { WindowSchema } from '@/generated/workspace_pb';
import { createTabFromChrome } from './tab';
import { create } from '@bufbuild/protobuf';
import type { Window } from '@/generated/workspace_pb';
import { WindowSchema } from '@/generated/workspace_pb';

export function createWindowFromChrome(chromeWindow: chrome.windows.Window): Window {
  return create(WindowSchema, {
    ...chromeWindow,
    tabs: chromeWindow.tabs?.map(createTabFromChrome) ?? [],
    id: chromeWindow.id!,
    focused: chromeWindow.focused ?? false,
    incognito: chromeWindow.incognito ?? false,
  });
}
