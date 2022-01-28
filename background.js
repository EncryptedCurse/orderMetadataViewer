const defaultOptions = {
	targetModule: true,
	bestBuyModule: true,
};

chrome.runtime.onInstalled.addListener((details) => {
	switch (details.reason) {
		case 'install':
			chrome.storage.sync.set(defaultOptions);
			break;
	}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	fetch(message.url, message.options).then((response) =>
		response.json().then((data) => sendResponse(data))
	);
	return true;
});
