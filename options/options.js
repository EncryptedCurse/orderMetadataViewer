function save() {
	chrome.storage.sync.set({
		targetModule: document.getElementById('targetModule').checked,
		bestBuyModule: document.getElementById('bestBuyModule').checked,
	});
}

function restore() {
	chrome.storage.sync.get(null, (options) => {
		document.getElementById('targetModule').checked = options.targetModule;
		document.getElementById('bestBuyModule').checked = options.bestBuyModule;
	});
}

document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);
