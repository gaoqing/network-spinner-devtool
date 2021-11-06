const isFirefox = typeof InstallTrigger !== 'undefined';
const browser = isFirefox && window.browser || window.chrome;
const listenerCallbackStore = {};
const houseKeepStore = new HouseKeepStore(listenerCallbackStore);

browser.runtime.onMessage.addListener(handleMessage);

browser.runtime.onConnect.addListener(function (port) {
    const {name} = port;
    if (name.indexOf("NetworkSpinner") > -1) {
        console.log("DevTools window opening: " + name);

        port.onDisconnect.addListener(function (port) {
            console.log("DevTools window closing: " + name);
            console.log("Clean up listeners for: " + name);
            houseKeepStore.cleanNameStore(name);
        });
    }
});

function getListenerCallback(listenerPairId, delaySec, isToDelayBeforeSending) {
    if (!listenerCallbackStore[listenerPairId]) {
        listenerCallbackStore[listenerPairId] = isFirefox ?
            firefoxListenerCallback(delaySec, isToDelayBeforeSending)
            : chromeListenerCallback(delaySec)
    }
    return listenerCallbackStore[listenerPairId];
}

function handleMessage(request, sender, sendResponse) {
    if ((sender.url !== browser.runtime.getURL("/index.html")) && (sender.url !== browser.runtime.getURL('/devtoolpage.html'))) {
        return;
    }

    if (request.webRequestOnBeforeRequestListenerAction) {
        const {webRequestOnBeforeRequestListenerAction, name, listenerPairId, filterUrl, delaySec, isToDelayBeforeSending} = request;
        const listener = getListenerCallback(listenerPairId, delaySec, isToDelayBeforeSending);

        if (webRequestOnBeforeRequestListenerAction === 'ADD') {
            browser.webRequest.onBeforeRequest.addListener(listener, {urls: [filterUrl]}, ["blocking"]);
            const cleanCallback = () => browser.webRequest.onBeforeRequest.removeListener(listener, {urls: [filterUrl]}, ["blocking"]);
            houseKeepStore.addCleaner(name, listenerPairId, cleanCallback);
            return;
        } else if (webRequestOnBeforeRequestListenerAction === 'REMOVE') {
            houseKeepStore.cleanAndDelete(name, listenerPairId);
            return;
        }
    }

    if (request.script) {
        // execute script in main content page
        return browser.tabs.executeScript(request.tabId, {code: request.script});
    }
}

function firefoxListenerCallback(delaySec, isToDelayBeforeSending) {
    const delaySecNum = Number(delaySec);

    return function (details) {
        if (isNaN(delaySecNum) || delaySecNum === 0) {
            console.log("immediate request to url: " + details.url);
            return Promise.resolve({});
        }
        if (delaySecNum < 0) {
            console.log("blocking request to url: " + details.url);
            return Promise.resolve({cancel: true});
        }
        if (delaySecNum > 0) {
            console.log(`delaying request ${delaySecNum}sec to url: ${details.url}`);
            // non-block in firefox
            if(isToDelayBeforeSending){
                return new Promise(resolve => {
                    setTimeout(() => resolve({}), delaySecNum * 1000);
                })
            } else {
                // is to delay the response data(if any) before sending back to the browser rendering engine (front page context)
                // this only supported by firefox
                filterResponseDataAsDelay(details.requestId, delaySec);
                return Promise.resolve({});
            }
        }
    };
}

function chromeListenerCallback(delaySec) {
    const delaySecNum = Number(delaySec);

    return function (details) {
        if (isNaN(delaySecNum) || delaySecNum === 0) {
            console.log("immediate request to url: " + details.url);
            return {};
        }
        if (delaySecNum < 0) {
            console.log("blocking request to url: " + details.url);
            return {cancel: true};
        }
        if (delaySecNum > 0) {
            console.log(`delaying request ${delaySecNum}sec to url: ${details.url}`);
            // spinning, that is blocking, cannot do non-blocking in chrome
            const start = Date.now();
            while (Date.now() - start < delaySecNum * 1000) {
            }
            return {};

           // filterResponseData is not supported by chrome:  https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData
           // so cannot introduce delay after receiving response data.
        }
    };
}

function filterResponseDataAsDelay(requestId, delaySec){
    const filter = browser.webRequest.filterResponseData(requestId);
    filter.ondata = event => {
        setTimeout(() => {
            filter.write(event.data);
            filter.disconnect();
        }, delaySec * 1000)
    }
}

function HouseKeepStore(listenerCallbackStore) {
    this.listenerCallbackStore = listenerCallbackStore;
    this.store = new Map();

    this.getNameStore = function (name) {
        if (!this.store.has(name)) {
            this.store.set(name, new Map());
        }
        return this.store.get(name);
    }

    this.addCleaner = function (name, id, cleanerFn) {
        this.getNameStore(name).set(id, cleanerFn);
    }

    this.cleanAndDelete = function (name, id) {
        const nameStore = this.getNameStore(name);
        if (nameStore.has(id)) {
            const cleanerFn = nameStore.get(id);
            typeof cleanerFn === 'function' && cleanerFn();
            nameStore.delete(id);
        }
    }

    this.cleanNameStore = function (name) {
        const nameStore = this.getNameStore(name);
        nameStore.forEach((cleanerFn, id) => {
            typeof cleanerFn === 'function' && cleanerFn();
            delete this.listenerCallbackStore[id];
        });
        this.store.delete(name);
    }
}