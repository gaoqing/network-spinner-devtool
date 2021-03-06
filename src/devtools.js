const isFirefox = typeof InstallTrigger !== 'undefined';
const browser = isFirefox && window.browser || window.chrome;

browser.devtools.panels.create(
    "RequestBlocker/Delayer",
    "logo.png",
    "index.html"
);

function sendMessageToBackground(message) {
    browser.runtime.sendMessage({
        tabId: browser.devtools.inspectedWindow.tabId,
        message
    });
}