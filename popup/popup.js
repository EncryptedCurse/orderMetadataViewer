import { getActiveTab, fetchData, formatNumberAsCurrency, insertTableEntry } from '../util.js';
import { targetConfig, bestBuyConfig } from '../siteConfig.js';

// get HTML elements
const loadingContainer = document.getElementById('loadingContainer');
const errorContainer = document.getElementById('errorContainer');
const errorTitle = document.getElementById('errorTitle');
const errorDescription = document.getElementById('errorDescription');
const metadataContainer = document.getElementById('metadataContainer');
const itemMetadataContainer = document.getElementById('itemMetadataContainer');
const orderMetadataTable = document.getElementById('orderMetadataTable');

function displayError(type) {
	document.body.style.backgroundColor = 'crimson';
	loadingContainer.style.display = 'none';
	errorContainer.style.display = 'revert';

	switch (type) {
		case 'disabled':
			errorTitle.innerText = 'Module disabled';
			errorDescription.innerHTML = 'Check <a class="extensionOptionsLink">extension options</a>';
			document
				.getElementsByClassName('extensionOptionsLink')[0]
				.addEventListener('click', () => chrome.runtime.openOptionsPage());
			break;
		case 'unauthorized':
			errorTitle.innerText = 'Login/refresh required';
			break;
	}
}

(async () => {
	const options = await chrome.storage.sync.get(null);

	// get URL
	const tab = await getActiveTab();
	const url = tab.url;

	// get config based on URL
	let config;

	if (options.targetModule && targetConfig.urlRegex.test(url)) {
		config = targetConfig;
	} else if (options.bestBuyModule && bestBuyConfig.urlRegex.test(url)) {
		config = bestBuyConfig;
	} else {
		displayError('disabled');
		return;
	}

	// get order number from URL
	const orderNumber = url.match(config.urlRegex)[1];

	// make API request
	const data = await fetchData(`${config.apiEndpoint}/${orderNumber}`, config.fetchOptions);
	console.log(data);

	// get relevant metadata
	let isLoggedIn;
	let orderMetadata;
	let itemMetadataCollection = {};

	if (config == targetConfig) {
		isLoggedIn = data.message?.toUpperCase() !== 'UNAUTHORIZED';
		if (!isLoggedIn) {
			displayError('unauthorized');
			return;
		}

		orderMetadata = [
			{
				attribute: 'Fraud status',
				value: data.fraud_status,
			},
			{
				attribute: 'Soft decline order',
				value: data.is_softdecline_order,
			},
			{
				attribute: 'Hard decline payment',
				value: data.is_payment_hard_declined,
			},
			{
				attribute: 'Payment authorization status',
				value: data.payment_transactions[0].authorization_status,
			},
			{
				attribute: 'Authorized payment amount',
				value: formatNumberAsCurrency(data.payment_transactions[0].amount),
			},
		];

		for (let i = 0; i < data.order_lines.length; i++) {
			const itemData = data.order_lines[i].fulfillment_spec.status;

			if (itemData.key.toUpperCase() === 'STAT_CANCELED') {
				itemMetadataCollection[i] = [
					{
						attribute: 'Cancel reason',
						value: `${itemData.cancel_reason_code}<br />${itemData.cancel_reason_text}<br />${itemData.cancel_reason_code_description}`,
					},
				];
			}
		}
	} else if (config == bestBuyConfig) {
		isLoggedIn = data.customer.status.toUpperCase() === 'AUTHENTICATED';
		if (!isLoggedIn) {
			displayError('unauthorized');
			return;
		}

		orderMetadata = [
			{
				attribute: 'ECC fraud indicator',
				value: data.order.callCenter.eccFraudIndicator,
			},
			{
				attribute: 'Payment authorization status',
				value: `${data.order.payments[0].authorizationStatus}<br />${data.order.payments[0].authorizationStatusDescription}`,
			},
			{
				attribute: 'Authorized payment amount',
				value: formatNumberAsCurrency(data.order.payments[0].authorizedAmount),
			},
		];

		for (let i = 0; i < data.order.items.length; i++) {
			const itemData = data.order.items[i].enterprise;

			if (itemData.status.toUpperCase() === 'CANCELLED') {
				itemMetadataCollection[i] = [
					{
						attribute: 'Cancel reason',
						value: `${itemData.cancelReasonCode}<br />${itemData.cancelReasonDescription}`,
					},
				];
			}
		}
	}

	// populate order metadata table
	for (const entry of orderMetadata) {
		insertTableEntry(orderMetadataTable, entry);
	}

	// create + populate item metadata table(s)
	for (const [i, itemMetadata] of Object.entries(itemMetadataCollection)) {
		const itemMetadataHeading = document.createElement('h3');
		itemMetadataHeading.innerHTML = `Item ${+i + 1}`;
		itemMetadataHeading.className = 'itemMetadataSubheading';

		const itemMetadataTable = document.createElement('table');
		for (const entry of itemMetadata) {
			insertTableEntry(itemMetadataTable, entry);
		}

		itemMetadataContainer.append(itemMetadataHeading, itemMetadataTable);
	}

	// hide loading container + show metadata container
	loadingContainer.style.display = 'none';
	metadataContainer.style.display = 'revert';
})();
