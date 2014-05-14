/*
 * Initialize to true; the content_script runs on page load
 * and adds all of the buttons
 */
var currentlyVisible = true;

chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.sendMessage(tab.id, {visible: !currentlyVisible});
    currentlyVisible = !currentlyVisible;
});