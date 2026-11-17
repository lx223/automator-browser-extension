import { requestRun, runRules, RUN_RULES_MESSAGE } from '@/engine/runner';
import { RULES_STORAGE_KEY } from '@/services/ruleStorage';

const RULES_ALARM = 'run-rules';

async function openExtensionPage() {
  const extensionUrl = chrome.runtime.getURL('index.html');
  const tabs = await chrome.tabs.query({ url: extensionUrl });

  if (tabs.length > 0) {
    const existingTab = tabs[0];
    await chrome.tabs.update(existingTab.id!, { active: true });
    if (existingTab.windowId) {
      await chrome.windows.update(existingTab.windowId, { focused: true });
    }
  } else {
    await chrome.tabs.create({ url: extensionUrl });
  }
}

async function ensureAlarm() {
  const existing = await chrome.alarms.get(RULES_ALARM);
  if (!existing) {
    await chrome.alarms.create(RULES_ALARM, { periodInMinutes: 1 });
  }
}

void ensureAlarm();

chrome.runtime.onInstalled.addListener(() => {
  requestRun();
});

chrome.runtime.onStartup.addListener(() => {
  requestRun();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === RULES_ALARM) {
    requestRun();
  }
});

chrome.tabs.onCreated.addListener(() => {
  requestRun();
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
  if (changeInfo.url !== undefined || changeInfo.title !== undefined || changeInfo.status === 'complete') {
    requestRun();
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && RULES_STORAGE_KEY in changes) {
    requestRun();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== RUN_RULES_MESSAGE) {
    return false;
  }
  runRules()
    .then((results) => sendResponse({ ok: true, results }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));
  return true;
});

chrome.action.onClicked.addListener(() => {
  void openExtensionPage();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-extensions-page') {
    void openExtensionPage();
  }
});
