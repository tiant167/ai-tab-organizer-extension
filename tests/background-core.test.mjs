import test from "node:test";
import assert from "node:assert/strict";
import * as backgroundCore from "../background-core.mjs";

const { getAutoCloseUnusedTabIds, getCandidateTabs, normalizeAutoCloseUnusedTabsSettings } = backgroundCore;

test("getCandidateTabs keeps only non-pinned http/https tabs", () => {
  const tabs = [
    { id: 1, pinned: false, url: "https://example.com/a" },
    { id: 2, pinned: false, url: "http://example.com/b" },
    { id: 3, pinned: true, url: "https://example.com/c" },
    { id: 4, pinned: false, url: "chrome://settings" },
    { id: 5, pinned: false, url: "chrome-extension://abc/popup.html" },
    { id: 6, pinned: false, url: "file:///Users/demo/test.html" },
    { id: 7, pinned: false, url: "about:blank" },
    { id: 8, pinned: false, url: "", pendingUrl: "https://pending.example.com" }
  ];

  assert.deepEqual(
    getCandidateTabs(tabs).map((tab) => tab.id),
    [1, 2, 8]
  );
});
test("normalizeAutoCloseUnusedTabsSettings defaults off and clamps threshold hours", () => {
  assert.deepEqual(normalizeAutoCloseUnusedTabsSettings({}), {
    enabled: false,
    thresholdHours: 24
  });

  assert.deepEqual(
    normalizeAutoCloseUnusedTabsSettings({
      autoCloseUnusedTabsEnabled: true,
      autoCloseUnusedTabsHours: 900
    }),
    {
      enabled: true,
      thresholdHours: 720
    }
  );
});

test("getAutoCloseUnusedTabIds selects only stale inactive web tabs", () => {
  const now = Date.UTC(2026, 0, 1, 12);
  const oneHour = 60 * 60 * 1000;

  assert.deepEqual(
    getAutoCloseUnusedTabIds(
      [
        { id: 1, url: "https://old.example", lastAccessed: now - 3 * oneHour },
        { id: 2, url: "https://recent.example", lastAccessed: now - oneHour },
        { id: 3, url: "https://active.example", active: true, lastAccessed: now - 3 * oneHour },
        { id: 4, url: "https://audio.example", audible: true, lastAccessed: now - 3 * oneHour },
        { id: 5, url: "https://pinned.example", pinned: true, lastAccessed: now - 3 * oneHour },
        { id: 6, url: "chrome://settings", lastAccessed: now - 3 * oneHour },
        { id: 7, url: "https://unknown.example" }
      ],
      now,
      2
    ),
    [1]
  );
});
