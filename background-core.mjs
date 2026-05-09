const ORGANIZABLE_PROTOCOLS = new Set(["http:", "https:"]);
export const AUTO_CLOSE_UNUSED_TABS_DEFAULT_HOURS = 24;
export const AUTO_CLOSE_UNUSED_TABS_MIN_HOURS = 1;
export const AUTO_CLOSE_UNUSED_TABS_MAX_HOURS = 720;

function getTabUrl(tab) {
  return String(tab?.url || tab?.pendingUrl || "").trim();
}

function isOrganizableTab(tab) {
  if (!tab?.id || tab?.pinned) {
    return false;
  }

  const url = getTabUrl(tab);

  if (!url) {
    return false;
  }

  try {
    return ORGANIZABLE_PROTOCOLS.has(new URL(url).protocol);
  } catch (_error) {
    return false;
  }
}

export function getCandidateTabs(tabs) {
  return (Array.isArray(tabs) ? tabs : []).filter(isOrganizableTab);
}

export function isOrganizableProtocol(url) {
  const value = String(url || "").trim();

  if (!value) {
    return false;
  }

  try {
    return ORGANIZABLE_PROTOCOLS.has(new URL(value).protocol);
  } catch (_error) {
    return false;
  }
}

export function normalizeAutoCloseUnusedTabsSettings(source) {
  const value = Number(source?.autoCloseUnusedTabsHours);
  const thresholdHours = Number.isFinite(value)
    ? Math.min(
        AUTO_CLOSE_UNUSED_TABS_MAX_HOURS,
        Math.max(AUTO_CLOSE_UNUSED_TABS_MIN_HOURS, Math.round(value))
      )
    : AUTO_CLOSE_UNUSED_TABS_DEFAULT_HOURS;

  return {
    enabled: Boolean(source?.autoCloseUnusedTabsEnabled),
    thresholdHours
  };
}

export function getAutoCloseUnusedTabIds(tabs, now = Date.now(), thresholdHours = AUTO_CLOSE_UNUSED_TABS_DEFAULT_HOURS) {
  const thresholdMs =
    normalizeAutoCloseUnusedTabsSettings({ autoCloseUnusedTabsHours: thresholdHours }).thresholdHours * 60 * 60 * 1000;

  return getCandidateTabs(tabs)
    .filter((tab) => {
      const lastAccessed = Number(tab.lastAccessed);

      return (
        !tab.active &&
        !tab.audible &&
        Number.isFinite(lastAccessed) &&
        lastAccessed > 0 &&
        now - lastAccessed >= thresholdMs
      );
    })
    .map((tab) => tab.id);
}
