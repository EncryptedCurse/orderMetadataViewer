import { getActiveTab, fetchData, insertTableEntry } from '../util.js';
import { targetConfig, bestBuyConfig } from '../siteConfig.js';

function handleLoginStatus(isLoggedIn) {
	if (!isLoggedIn) {
		window.close();
		return;
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
		window.close();
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
		handleLoginStatus(isLoggedIn);

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
		handleLoginStatus(isLoggedIn);

		orderMetadata = [
			{
				attribute: 'ECC fraud indicator',
				value: data.order.callCenter.eccFraudIndicator,
			},
			{
				attribute: 'Payment authorization status',
				value: `${data.order.payments[0].authorizationStatus}<br />${data.order.payments[0].authorizationStatusDescription}`,
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

	// display order metadata to user
	const orderMetadataTable = document.getElementById('orderMetadataTable');
	for (const entry of orderMetadata) {
		insertTableEntry(orderMetadataTable, entry);
	}

	// display item metadata to user
	const itemMetadataDiv = document.getElementById('itemMetadataDiv');
	for (const [i, itemMetadata] of Object.entries(itemMetadataCollection)) {
		const itemMetadataHeading = document.createElement('h3');
		itemMetadataHeading.innerHTML = `Item ${+i + 1} metadata`;
		itemMetadataHeading.className = 'itemMetadataHeading';

		const itemMetadataTable = document.createElement('table');
		for (const entry of itemMetadata) {
			insertTableEntry(itemMetadataTable, entry);
		}

		itemMetadataDiv.append(itemMetadataHeading, itemMetadataTable);
	}
})();
