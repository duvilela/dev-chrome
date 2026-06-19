chrome.action.onClicked.addListener(function(tab){
    chrome.tabs.create({ url: 'https://www.instagram.com' }, function (tab) {
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, updatedTab) {
            if (tabId === tab.id && changeInfo.status === 'complete') {
                chrome.scripting.insertCSS({
                    files: ['contentScript.css'],
                    target: {tabId: tab.id}
                });
                chrome.scripting.executeScript({
                    files: ['contentScript.js'],
                    target: { tabId: tab.id }
                });
                chrome.tabs.onUpdated.removeListener(listener);
            }
        });
    });
});