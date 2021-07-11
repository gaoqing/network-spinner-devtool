const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
const browser = isChrome? window.chrome: window.browser;

browser.devtools.panels.create(
    "NetworkSpinner",
    "logo.png",
    "index.html"
);

