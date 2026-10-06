const INSTAGRAM_TAB_URL = "https://www.instagram.com/";

function isInstagramUrl(url) {
    return typeof url === "string" && /^https:\/\/([a-z0-9-]+\.)?instagram\.com\//i.test(url);
}

function inject(tabId) {
    chrome.scripting.insertCSS({
        files: ["contentScript.css"],
        target: { tabId: tabId }
    }).catch(() => {});

    chrome.scripting.executeScript({
        files: ["contentScript.js"],
        target: { tabId: tabId }
    }).catch((error) => {
        console.warn("[InstaUnfollow] Não foi possível injetar o script:", error);
    });
}

function injectWhenReady(tabId) {
    const listener = (updatedTabId, changeInfo) => {
        if (updatedTabId === tabId && changeInfo.status === "complete") {
            chrome.tabs.onUpdated.removeListener(listener);
            inject(tabId);
        }
    };
    chrome.tabs.onUpdated.addListener(listener);
}

async function handleActionClick() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs && tabs[0];

        if (activeTab && isInstagramUrl(activeTab.url)) {
            if (activeTab.status === "complete") {
                inject(activeTab.id);
            } else {
                injectWhenReady(activeTab.id);
            }
            return;
        }

        const allTabs = await chrome.tabs.query({});
        const existing = allTabs.find((tab) => isInstagramUrl(tab.url));

        if (existing) {
            await chrome.tabs.update(existing.id, { active: true });
            if (existing.status === "complete") {
                inject(existing.id);
            } else {
                injectWhenReady(existing.id);
            }
            return;
        }

        const created = await chrome.tabs.create({ url: INSTAGRAM_TAB_URL });
        injectWhenReady(created.id);
    } catch (error) {
        console.warn("[InstaUnfollow] Erro ao abrir/injetar:", error);
    }
}

chrome.action.onClicked.addListener(handleActionClick);
