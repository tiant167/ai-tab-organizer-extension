const ORGANIZABLE_PROTOCOLS = new Set(["http:", "https:"]);

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

export function buildExistingTabGroupContext(tabs, tabGroups) {
  const tabList = Array.isArray(tabs) ? tabs : [];
  const groupsById = new Map((Array.isArray(tabGroups) ? tabGroups : []).map((group) => [group.id, group]));
  const grouped = new Map();

  for (const tab of tabList) {
    if (!tab?.id || typeof tab.groupId !== "number" || tab.groupId === -1) {
      continue;
    }

    if (!grouped.has(tab.groupId)) {
      const group = groupsById.get(tab.groupId) || {};
      grouped.set(tab.groupId, {
        id: tab.groupId,
        title: String(group.title || "").trim() || "Untitled group",
        color: group.color || "grey",
        collapsed: Boolean(group.collapsed),
        tabIds: [],
        tabs: []
      });
    }

    const entry = grouped.get(tab.groupId);
    entry.tabIds.push(tab.id);
    entry.tabs.push({
      id: tab.id,
      title: tab.title || "Untitled",
      url: getTabUrl(tab),
      index: tab.index
    });
  }

  return [...grouped.values()].sort((a, b) => {
    const aFirstIndex = Math.min(...a.tabs.map((tab) => Number.isFinite(tab.index) ? tab.index : 0));
    const bFirstIndex = Math.min(...b.tabs.map((tab) => Number.isFinite(tab.index) ? tab.index : 0));
    return aFirstIndex - bFirstIndex;
  });
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
