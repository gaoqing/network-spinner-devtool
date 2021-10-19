# Network Spinner

This [network-spinner-devtool](https://github.com/gaoqing/network-spinner-devtool) is a browser devtool extension, to allow introducing delay before sending http requests to configurable endpoints.

Though browser itself provide throttling in different network conditions(slow 3G etc), that will impact all network requests, that is not fit for some purpose.

This tool can config target endpoints to which requests can apply delays, aiming at assisting user testing to detect any race condition issue within webapp handling logic, which can mixed with fast endpoints and very slow endpoints. 

It supports both requests delaying and requests blocking(browser also support blocking anyway)

A quick demo:

![til](./demo.gif)

### Browser supports
It supports both Firefox and Chrome.

* Firefox, it well supports delaying requests to config endpoints in a NON-BLOCKING way, for example 5 requests to 5 different config endpoints, and assume they are fired in consecutive order, one will not block the others, each timer will be started exactly at the moment the request being issued, all 5 timers will be running in parallel and independently.
  

* Chrome, however it delays requests to config endpoints in BLOCKING way, for example 5 requests to 5 different config endpoints, and assume they are fired in consecutive order, but the 1st request will block 2nd request, means the 2nd request can only be fired after 1st one delay time passed, the 3rd will need to wait the 2nd, 3rd block 4th, 4th block 5th etc.

Choose the test browser based on above non-blocking / blocking feature.

### Usage
##### It is listed in Chrome web store, can install from there (https://chrome.google.com/webstore/detail/network-spinner/klhfgmmihbgojnnbhdbnefjmiidlgfld)
or if want to locally install and try:

* In Firefox: Open the about:debugging page, click "This Firefox" (in newer versions of Firefox), click "Load Temporary Add-on", then select any file in your extension's directory.
* In Chrome: Open the chrome://extensions page, click load unpacked, and then select the folder in which the manifest.json file exists. 
* After that, in your website, press F12, and navigate to panel "NetworkSpinner", and add target URLs(support certain [wildcard pattern](https://developer.chrome.com/docs/extensions/mv3/match_patterns/), separate each url on a new line), tick the box to delay(with delay time in second) or block completely.
* Always keep the devtool window opened while using(regardless which panel tab shown), then refresh the website page to check the effect.
* NOTE: If you close the devtool window, all settings will be removed and back to normal.  

<br/>
At last, thanks Allen Xu for this idea.
