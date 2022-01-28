const numberFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatNumberAsCurrency(number) {
	return numberFormatter.format(number);
}

export function getActiveTab() {
	return new Promise((resolve) =>
		chrome.tabs.query(
			{
				active: true,
				currentWindow: true,
			},
			(tabs) => resolve(tabs[0])
		)
	);
}

export function fetchData(url, options) {
	return new Promise((resolve) =>
		chrome.runtime.sendMessage({ url, options }, (response) => resolve(response))
	);
}

export function insertTableEntry(table, entry) {
	const newRow = table.insertRow();
	const newTitleCell = newRow.insertCell();
	newTitleCell.innerHTML = entry.attribute;
	const newTextCell = newRow.insertCell();
	newTextCell.innerHTML = entry.value;
}
