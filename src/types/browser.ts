import type { Tab as TabMessage, Group as GroupMessage, Window as WindowMessage } from '../gen/browser/v1/browser_pb';

// Domain snapshots also travel through Chrome's JSON messaging and storage.
// Keep their shape derived from Protobuf without requiring runtime message metadata.
export type Tab = Omit<TabMessage, '$typeName'>;
export type Group = Omit<GroupMessage, '$typeName'>;
export type Window = Omit<WindowMessage, '$typeName' | 'tabs'> & { tabs: Tab[] };
