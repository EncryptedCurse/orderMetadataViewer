function save() {
	const options = {
		clearConsole: document.getElementById('clearConsole').checked,
		logAll: document.getElementById('logAll').checked,
		targetModule: document.getElementById('targetModule').checked,
		bestBuyModule: document.getElementById('bestBuyModule').checked,
	};
	chrome.storage.sync.set(options);
}

function restore() {
	chrome.storage.sync.get(
		{
			clearConsole: true,
			logAll: true,
			targetModule: true,
			bestBuyModule: true,
		},
		(items) => {
			document.getElementById('clearConsole').checked = items.clearConsole;
			document.getElementById('logAll').checked = items.logAll;
			document.getElementById('targetModule').checked = items.targetModule;
			document.getElementById('bestBuyModule').checked = items.bestBuyModule;
		}
	);
}

document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);
