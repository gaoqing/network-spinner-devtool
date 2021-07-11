const isFirefox = typeof InstallTrigger !== 'undefined';
const browser = isFirefox && window.browser || window.chrome;

browser.runtime.onMessage.addListener(handleMessage);

const LISTENERS_STORE = {};

function handleMessage(request, sender, sendResponse) {
    if (sender.url !== browser.runtime.getURL("/index.html")) {
        return;
    }

    if(request.webRequestOnBeforeRequestListenerAction){
        const {webRequestOnBeforeRequestListenerAction, listenerId, filterUrl, delaySec} = request;
        if(!LISTENERS_STORE[listenerId]){
            LISTENERS_STORE[listenerId] = createListenerCallback(delaySec);
        }
        const listener = LISTENERS_STORE[listenerId];

        if(webRequestOnBeforeRequestListenerAction === 'ADD'){
            return browser.webRequest.onBeforeRequest.addListener(listener, {urls: [filterUrl]}, ["blocking"]);
        }
        else if(webRequestOnBeforeRequestListenerAction === 'REMOVE'){
            return browser.webRequest.onBeforeRequest.removeListener(listener, {urls: [filterUrl]}, ["blocking"]);
        }
        return;
    }

    if(request.script){
        // execute script in main content page
        browser.tabs.executeScript(request.tabId, { code: request.script });
    }
}

function createListenerCallback(delaySec){
     const delaySecNum = Number(delaySec);

     return function(details) {
         if(isNaN(delaySecNum) || delaySecNum === 0){
             console.log("To issue request with no delay to url: " + details.url);
             return Promise.resolve({});
         }
         if(delaySecNum < 0 ){
             console.log("To block request to url: " + details.url);
             return Promise.resolve({cancel: true});
         }
         if(delaySecNum > 0) {
             console.log(`To delay request ${delaySecNum}s to url: ${details.url}`);
             return new Promise(resolve => {
                 setTimeout(() => resolve({}), delaySecNum * 1000);
             })
         }
     };
}