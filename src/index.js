const instanceName = "NetworkSpinner_" + Date.now() + Math.random();
const isFirefox = typeof InstallTrigger !== 'undefined';
const browser = isFirefox && window.browser || window.chrome;
browser.runtime.connect({name: instanceName});
const log = console.log;

const input = document.getElementById('input')
const urlListElement = document.getElementById('url-list')
const template = document.getElementById("template-id");
const addUrlBtn = document.getElementById('btn');
const header = document.getElementById('header');

const listingUrls = new Set();
addUrlBtn.addEventListener('click', addUrlListeners)

function addUrlListeners() {
    const validUrls = new Set();
    const invalidUrls = new Set();
    const duplicatedUrls = new Set();

    const urls = input.value && input.value.trim().split('\n')
        .map(url => url.replace(/^\s+|\s+$/g, ''))
        .filter(url => url.length > 0);

    urls.forEach(url => {
        const enrichedUrl = validateUrl(url);
        enrichedUrl && validUrls.add(enrichedUrl) || invalidUrls.add(url);
    });

    validUrls.forEach(url => {
        header.classList.contains('hide') && header.classList.remove('hide');
        if (listingUrls.has(url)) {
            duplicatedUrls.add(url);
        } else {
            listingUrls.add(url);
            singleUrlListener(url);
        }
    })

    clearAllWarnings();
    let msg = '';
    if (duplicatedUrls.size > 0) {
        showDuplicateUrlWarning(duplicatedUrls);
        msg += Array.from(duplicatedUrls).join("\n");
        msg += "\n";
    }
    if (invalidUrls.size > 0) {
        showInvalidUrlWarning(invalidUrls);
        msg += Array.from(invalidUrls).join("\n");
    }
    input.value = msg;
}

function singleUrlListener(url) {
    const item = document.importNode(template.content, true);
    const div = item.querySelector('div');
    const urlSpan = item.querySelector('span');
    const deleteBtn = item.querySelector('button');
    const typeSelect = item.querySelector('select');
    const inputs = item.querySelectorAll('input');
    const [delayBox, delayTimeInput, blockBox] = inputs;
    urlSpan.textContent = url;

    if(isFirefox){
        // enable typeSelect checkbox 'after'/'before' options for firefox, only support 'after' in firefox
        typeSelect.removeAttribute("disabled");
    }
    const isToDelayBeforeSending = () => {
        return typeSelect.value.toLowerCase() === 'before';
    }

    const [addBlockListener, removeBlockListener] = createOnBeforeRequestListeners(url, -1, isToDelayBeforeSending());
    let [addDelayListener, removeDelayListener] = createOnBeforeRequestListeners(url, delayTimeInput.value, isToDelayBeforeSending());

    deleteBtn.addEventListener('click', e => {
        clearAllWarnings();
        removeBlockListener();
        removeDelayListener();
        listingUrls.delete(url);
        urlListElement.removeChild(div);
        log("Remove all settings for url: " + url)
    });

    blockBox.addEventListener('click', e => {
        clearAllWarnings();
        if (e.target.checked) {
            addBlockListener();
            removeDelayListener();
            delayBox.checked = false;
            delayTimeInput.disabled = true;
            typeSelect.setAttribute("disabled", 'true');
            log("Block set for url: " + url)
        } else {
            removeBlockListener();
            delayTimeInput.disabled = false;
            isFirefox && typeSelect.removeAttribute("disabled");
            log("Un-block set for url: " + url)
        }
    });

    delayBox.addEventListener('click', e => {
        clearAllWarnings();
        if (e.target.checked) {
            addDelayListener();
            removeBlockListener();
            blockBox.checked = false;
            delayTimeInput.disabled = false;
            isFirefox && typeSelect.removeAttribute("disabled");
            log(`Delay set ${delayTimeInput.value}sec for url: ${url}, and isToDelayBeforeSending = ${isToDelayBeforeSending()}`)
        } else {
            removeDelayListener();
            log("Remove delay set for url: " + url)
        }
    });

    const recreateDelayListener = e => {
        const isDelayBoxChecked = delayBox.checked;
        const toDelayBeforeSending = isToDelayBeforeSending();
        if (isDelayBoxChecked) {
            removeDelayListener();
        }
        [addDelayListener, removeDelayListener] = createOnBeforeRequestListeners(url, delayTimeInput.value, toDelayBeforeSending);
        if(isDelayBoxChecked){
            log(`Delay set ${delayTimeInput.value}sec for url: ${url}, and isToDelayBeforeSending = ${toDelayBeforeSending}`);
            addDelayListener();
        }
    }

    let lastDelayTimeValue = delayTimeInput.value;
    delayTimeInput.addEventListener('blur', () => {
        if (lastDelayTimeValue !== delayTimeInput.value) {
            lastDelayTimeValue = delayTimeInput.value;
            recreateDelayListener();
        }
    });

    typeSelect.addEventListener("change", () => recreateDelayListener());
    delayTimeInput.addEventListener('click', e => e.target.select());
    delayTimeInput.addEventListener('keyup', e => e.key === 'Enter' && e.target.blur());

    urlListElement.insertAdjacentElement('afterbegin', div);
}

/*
* @filterUrl need to match pattern https://developer.chrome.com/docs/extensions/mv3/match_patterns/
* @delaySec, if delaySec < 0 to block request, delaySec = 0 fire without delay, delaySec > 0 to apply delaySec in sec
* @isToDelayBeforeSending, default to be true, means delay delaySec time before sending the request to hit network,
* if false(support only in Firefox), means it will immediately send request to network but after receive response data(if any), it delay delaySec before writing response data back to the front page engine.
*/
function createOnBeforeRequestListeners(filterUrl, delaySec, isToDelayBeforeSending= true) {
    const listenerPairId = "OnBeforeRequestListener_" + Date.now() + Math.random();
    const add = () => {
        browser.runtime.sendMessage({
            tabId: browser.devtools.inspectedWindow.tabId,
            webRequestOnBeforeRequestListenerAction: 'ADD',
            name: instanceName,
            listenerPairId,
            filterUrl,
            delaySec,
            isToDelayBeforeSending
        });
    }

    const remove = () => {
        browser.runtime.sendMessage({
            tabId: browser.devtools.inspectedWindow.tabId,
            webRequestOnBeforeRequestListenerAction: 'REMOVE',
            name: instanceName,
            listenerPairId,
            filterUrl,
            delaySec,
            isToDelayBeforeSending
        });
    }

    return [add, remove];
}

function validateUrl(value) {
    // check hostname part, help to append trailing /* if there is no
    const parts = /^(http|https|\*)(:\/\/)([-a-zA-Z0-9*@:%._+#=]+)(\/*)([-a-zA-Z0-9*()@:;%_+.~#?&/=]*)$/.exec(value);
    if (parts && parts.length === 6) {
        const hostname = parts[3];
        // if '*' is in the host, it can only be the first character
        if (hostname.lastIndexOf('*') > 0) {
            return false;
        } else if (hostname.lastIndexOf('*') === 0) {
            // if * not followed by '.'
            if (hostname.length > 1 && hostname[1] !== '.') {
                return false;
            }
        }
        if (parts[5] === '') {
            // no path and/or search element, help to append trading /*
            return parts[1] + parts[2] + parts[3] + "/*";
        } else if (parts[4] === '/' && parts[5] !== '') {
            return value;
        }
    }

    return false;
}

function showInvalidUrlWarning(urlSet) {
    const urlValues = Array.from(urlSet).join(', ');
    const warnMsg = `[${urlValues}] not valid url pattern.`;
    showWarning(warnMsg);
    const htmlMsg = `Check <a target="_blank" href="https://developer.chrome.com/docs/extensions/mv3/match_patterns/"> https://developer.chrome.com/docs/extensions/mv3/match_patterns/</a>`
    showWarning(htmlMsg, true);
    sendMessageToContentPage(`NetworkSpinner: [${urlValues}] not valid url pattern. Check https://developer.chrome.com/docs/extensions/mv3/match_patterns/`);
}

function showDuplicateUrlWarning(urlSet) {
    const urlValues = Array.from(urlSet).join(', ');
    const warnMsg = `[${urlValues}] have already listed.`;
    showWarning(warnMsg);
    sendMessageToContentPage(warnMsg);
}

function clearAllWarnings() {
    const warnElements = document.querySelectorAll('.warn-msg');
    if (warnElements.length > 0) {
        warnElements.forEach(el => document.body.removeChild(el));
    }
}

function showWarning(message, isHtml) {
    const msg = document.createElement('p')
    msg.classList.add('warn-msg');
    const contentType = isHtml? 'innerHTML': 'textContent';
    msg[contentType] = message;
    document.body.appendChild(msg);
    console.warn(message);
}

function sendMessageToContentPage(msg) {
    // through the background script
    const scriptToAttach = 'console.error("' + msg + '");';
    browser.runtime.sendMessage({
        tabId: browser.devtools.inspectedWindow.tabId,
        script: scriptToAttach
    });
}
