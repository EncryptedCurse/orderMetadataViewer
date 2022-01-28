import { targetConfig, bestBuyConfig } from './siteConfig.js';

function simplifyRegex(regex) {
	return regex.toString().replace('/(?:', '').replace('/i', '').replaceAll('(', '').replaceAll(')', '');
}

chrome.runtime.onInstalled.addListener((details) => {
	// disable action on all domains by default
	chrome.action.disable();

	// initialize options with defaults
	if (details.reason === 'install') {
		chrome.storage.sync.set({
			targetModule: true,
			bestBuyModule: true,
		});
	}

	// enable action on select URLs
	chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
		const actions = [new chrome.declarativeContent.ShowPageAction()];
		const rules = [
			{
				conditions: [
					new chrome.declarativeContent.PageStateMatcher({
						pageUrl: { urlMatches: simplifyRegex(targetConfig.urlRegex) },
					}),
				],
				actions,
			},
			{
				conditions: [
					new chrome.declarativeContent.PageStateMatcher({
						pageUrl: { urlMatches: simplifyRegex(bestBuyConfig.urlRegex) },
					}),
				],
				actions,
			},
		];
		chrome.declarativeContent.onPageChanged.addRules(rules);
	});
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	fetch(message.url, message.options).then((response) =>
		response.json().then((data) => sendResponse(data))
	);
	return true;
});
