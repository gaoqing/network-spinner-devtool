const input = document.getElementById('input')
const urlList = document.getElementById('url-list')
const template = document.getElementById("template-id");
const addUrlBtn = document.getElementById('btn');

addUrlBtn.addEventListener('click', addUrlListener)

function addUrlListener(e) {
    let value = input.value;
    if(!validateUrl(value)){
        return;
    }
    input.value='';

    const item = document.importNode(template.content, true);
    const div = item.querySelector('div');

    const urlSpan = item.querySelector('span');
    urlSpan.textContent = value;
    const deleteBtn = item.querySelector('button');

    const inputs = item.querySelectorAll('input');
    const [delayBox, delayTimeInput, blockBox] = inputs;
    const [addBlockListener, removeBlockListener ] = createOnBeforeRequestListeners(value, -1);
    let [addDelayListener, removeDelayListener ] = createOnBeforeRequestListeners(value, delayTimeInput.value);

    deleteBtn.addEventListener('click', e => {
        removeBlockListener();
        removeDelayListener();
        urlList.removeChild(div);
    })

    blockBox.addEventListener('click', e => {
        clearError();
        if(e.target.checked){
            addBlockListener();
            removeDelayListener();
            delayBox.checked = false;
            delayTimeInput.disabled = true;
        }else{
            removeBlockListener();
        }
    })

    delayBox.addEventListener('click', e => {
        clearError();
        if(e.target.checked){
            addDelayListener();
            removeBlockListener();
            delayTimeInput.disabled = false;
            blockBox.checked = false;
        }else{
            removeDelayListener();
        }
    })

    delayTimeInput.addEventListener('change', e => {
        removeBlockListener();
        removeDelayListener();
        [addDelayListener, removeDelayListener ] = createOnBeforeRequestListeners(value, delayTimeInput.value);
        addDelayListener();
    })

    urlList.insertAdjacentElement('afterbegin', div);
}

function validateUrl(value){
    const urlValue = value;
    const existing = document.getElementById('error-msg');
    if(existing){
        document.body.removeChild(existing);
    }
    const wildcardProtocol = '*://'
    const protocolPlaceHolder = 'http://'
    const isWildcardProtocol = value.indexOf(wildcardProtocol) === 0;
    if(isWildcardProtocol){
        value = value.replace(wildcardProtocol, protocolPlaceHolder)
    }

    try{
        // https//test.*.cn/pathname invalid, if need to use wildcard in hostname, should do from starting of hostname(not in middle or end)
        // and then follow by . or / only
        const url = new URL(value);
        const {hostname, search} = url;
        const starWildcard = '%2A';
        const starWildcardLen = starWildcard.length;

        if(hostname.lastIndexOf(starWildcard) > 0){
            showError(urlValue);
            return null;
        }
        if(hostname.lastIndexOf(starWildcard) === 0){
            // need to follow by a . or /
            if(hostname.length > starWildcardLen && hostname[starWildcardLen] !== '.'){
                showError(urlValue);
                return null;
            }
        }
        // if host is wildcard but not follow by . and also no search parameter, then help to append ending / anyway
        if(search === '' && value.charAt(value.length-1) !== '/'){
            value =  value + '/';
        }
    }catch (e){
        showError(urlValue);
        return null;
    }

    return isWildcardProtocol? value.replace(protocolPlaceHolder, wildcardProtocol): value;
}

function clearError(){
    const existingErr = document.getElementById('error-msg');
    if(existingErr){
        document.body.removeChild(existingErr);
    }
}

function showError(urlValue){
    const msg= document.createElement('p')
    msg.setAttribute('id', 'error-msg');
    const errorMsg = `[${urlValue}] is not a valid URL pattern, check 
            <a target="_blank" href="https://developer.chrome.com/docs/extensions/mv3/match_patterns/">
            https://developer.chrome.com/docs/extensions/mv3/match_patterns/
            </a>`;
    msg.innerHTML = errorMsg;
    document.body.appendChild(msg);
    console.error(errorMsg);
    messageToContentPage(errorMsg);
}

function messageToContentPage(msg){
    // through the background script
    const scriptToAttach = `console.log('${msg}');`;
    browser.runtime.sendMessage({
        tabId: browser.devtools.inspectedWindow.tabId,
        script: scriptToAttach
    });
}

/*
* @filterUrl need to match pattern https://developer.chrome.com/docs/extensions/mv3/match_patterns/
* @delaySec, if delaySec < 0 to block request, delaySec = 0 fire without delay, delaySec > 0 to apply delaySec in sec
*/
function createOnBeforeRequestListeners(filterUrl, delaySec){
    const isFirefox = typeof InstallTrigger !== 'undefined';
    if(isFirefox){
        return firefoxOnBeforeRequestListener(filterUrl, delaySec);
    }
    return chromeOnBeforeRequestListener(filterUrl, delaySec);

}

function firefoxOnBeforeRequestListener(filterUrl, delaySec){
    const listenerId = Date.now() + "_" + Math.random();
    const add = () => {
        browser.runtime.sendMessage({
            tabId: browser.devtools.inspectedWindow.tabId,
            webRequestOnBeforeRequestListenerAction: 'ADD',
            listenerId,
            filterUrl,
            delaySec
        });
    }

    const remove = () => {
        browser.runtime.sendMessage({
            tabId: browser.devtools.inspectedWindow.tabId,
            webRequestOnBeforeRequestListenerAction: 'REMOVE',
            listenerId,
            filterUrl,
            delaySec
        });
    }

    return [add, remove];
}

function chromeOnBeforeRequestListener(filterUrl, delaySec){
    const delaySecNum = Number(delaySec);
    const listener =  function(details) {
        if(isNaN(delaySecNum) || delaySecNum === 0){
            console.log("To issue request with no delay to url: " + details.url);
            return {};
        }
        if(delaySecNum < 0 ){
            console.log("To block request to url: " + details.url);
            return {cancel: true};
        }
        if(delaySecNum > 0) {
            console.log(`To delay request ${delaySecNum}s to url: ${details.url}`);
            // spinning, that is blocking, cannot do non-blocking in chrome
            const start = Date.now();
            while (Date.now() - start < delaySecNum * 1000){}
            return {};
        }
    };

    const browser = window.chrome;
    const add = () =>  browser.webRequest.onBeforeRequest.addListener(listener, {urls: [filterUrl]}, ["blocking"]);
    const remove = () => browser.webRequest.onBeforeRequest.removeListener(listener, {urls: [filterUrl]}, ["blocking"]);

    return [add, remove];
}


