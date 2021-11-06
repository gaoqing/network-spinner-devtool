# Network Spinner

This [network-spinner-devtool](https://github.com/gaoqing/network-spinner-devtool) is a browser devtools extension, with capacity of URL level configuration and control, to allow introducing delay before sending http request or after receiving response(support in firefox only).

Although browser itself provide throttling in different network conditions(slow 3G etc), that will impact all requests, that is not fit for some purpose.

This tool can config target URLs to which requests will be delayed deliberately. It can be helpful to assist debugging potential race condition issues might be hidden inside complex logic, which can mix with fast/slow, stable/unstable endpoints. 

It supports both requests delaying and requests blocking(browser also support blocking anyway)

A quick demo:

![til](./demo.gif)

### Browser supports
It supports both Firefox and Chrome.

* Firefox, it well supports delaying requests to config endpoints in a NON-BLOCKING way, for example: 5 requests to 5 different endpoints, and assume they are fired in consecutive order, one will not block the others, each timer will be started exactly at the moment the request being issued, all 5 timers will be running in parallel and independently.

* Chrome, however it delays requests to config endpoints in BLOCKING way, for example: 5 requests to 5 different endpoints, and assume they are fired in consecutive order, but the 1st request will block 2nd request, means the timer of 2nd request can only start after 1st timer elapsed, the 3rd timer will need to wait the 2nd's time elapsed, 3rd block 4th, 4th block 5th etc.

Choose the test browser based on above non-blocking / blocking feature.

### Usage
##### It is deployed in Chrome web store, can install directly from there (https://chrome.google.com/webstore/detail/network-spinner/klhfgmmihbgojnnbhdbnefjmiidlgfld)
or locally you can clone this codebase, then install and try:

* In Firefox: Open the about:debugging page, click "This Firefox" (in newer versions of Firefox), click "Load Temporary Add-on", then select any file in the extension's directory.
* In Chrome: Open the chrome://extensions page, click load unpacked, and then select the folder in which the manifest.json file exists. 
* After that, in your website, press F12, and navigate to panel "NetworkSpinner", and add target URLs(support certain [wildcard pattern](https://developer.chrome.com/docs/extensions/mv3/match_patterns/), separate each url on a new line), choose relevant checkbox or input.
* Always keep the devtool window opened while using(regardless which panel tab in view), then refresh the website page to check the effect.
* NOTE: If you close the devtool window, all settings will be removed and back to normal.  

### Inputs
*  `delaySec` `delayType` work together with `delay` checkbox for delaying request.`delaySec` is the time in second for the delay.
*  `delayType.before` hold the request in browser end before sending the request down to the network. <ins>(Support both Firefox and Chrome)</ins>
*  `delayType.after` immediately sends the request down to the network BUT hold its response data(if any) for `delaySec` time before releasing data to the browser engine. <ins>(Support only in Firefox)</ins>
*  `block` checkbox is for blocking the request.


<br/>
At last, thanks Xu Zong for this idea.
