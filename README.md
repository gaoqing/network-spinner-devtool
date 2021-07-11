# Network Spinner

This is an extension in web browser devtools panel, to allow introducing delay before sending network request for configurable endpoints.

Though browser itself provide throttling in different networks conditions(slow 3G etc), that will impact all network requests, that is not fit for some purpose.

This tool can config target endpoints to introduce delay only for those, aiming at assisting user testing to detect any race condition issue within webapp handling logic, which mixed with both fast endpoints and very slow endpoints. 

It supports both network delaying and network blocking(browser also support blocking anyway)

### Browser supports
It supports both Firefox and Chrome browser.

* In Firefox, it well supports delaying config endpoints in a NON-BLOCKING way, for example 5 endpoints being config to be delayed and assume they are fired one by one in consecutive order, one will not block the others, the timer will be started exactly at the moment the request issued, all 5 timer clock will be running in parallel and independently. 
  
* In Chrome, however it delays config endpoints in BLOCKING way, for example 5 endpoints being config to be delayed and assume they are fired one by one in consecutive order, but the 1st request will block 2nd request, means the 2nd request will only be fired after 1st one delay time passed, the 3rd will need to wait the 2nd, 3rd block 4th, 4th block 5th etc.

choose the test browser based on above non-blocking / blocking feature.

### Usage
* In Firefox: Open the about:debugging page, click "This Firefox" (in newer versions of Firefox), click "Load Temporary Add-on", then select any file in your extension's directory.
* In Chrome: Open the chrome://extensions page, click load unpacked, and then select the folder in which the manifest file exists. 
* After that, in your web site, press F12, and navigate to panel "NetworkSpinner", and add a target url(support certain wildcard pattern: https://developer.chrome.com/docs/extensions/mv3/match_patterns/), and then choose to delay and delay time in second or completely to block it.
<br/>Refresh the web page to check the effect.

<br/>
At last, thanks Allen Xu for this idea, and it helps me kill a summer weekend in a cool room with busy AC:)