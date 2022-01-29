import { getActiveTab, fetchData, formatNumberAsCurrency, insertTableEntry } from '../util.js';
import { targetConfig, bestBuyConfig } from '../siteConfig.js';

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'long' });

// get HTML elements
const loadingContainer = document.getElementById('loadingContainer');
const errorContainer = document.getElementById('errorContainer');
const errorTitle = document.getElementById('errorTitle');
const errorDescription = document.getElementById('errorDescription');
const orderMetadataContainer = document.getElementById('orderMetadataContainer');
const itemMetadataContainer = document.getElementById('itemMetadataContainer');
const orderMetadataTable = document.getElementById('orderMetadataTable');

function displayError(type = null) {
	document.body.style.backgroundColor = 'crimson';
	loadingContainer.style.display = 'none';
	errorContainer.style.display = 'revert';

	switch (type) {
		case 'disabled':
			errorTitle.innerText = 'Module disabled';
			errorDescription.innerHTML = 'Check <a class="link">extension options</a>';
			document
				.getElementsByClassName('link')[0]
				.addEventListener('click', () => chrome.runtime.openOptionsPage());
			break;
		case 'unauthorized':
			errorTitle.innerText = 'Login/refresh required';
			errorDescription.innerText = 'Token expired';
			break;
		default:
			errorTitle.innerText = 'Unknown error encountered';
			errorDescription.innerText = 'Try again later';
			break;
	}
}

(async () => {
	try {
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
					attribute: 'Submitted date',
					value: dateFormatter.format(Date.parse(data.placed_date)),
				},
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
					attribute: 'Original payment amount',
					value: formatNumberAsCurrency(
						+data.summary.grand_total || data.payment_transactions[0].amount
					),
				},
			];

			for (let i = 0; i < data.order_lines.length; i++) {
				const itemData = data.order_lines[i];

				if (itemData.fulfillment_spec.status.key.toUpperCase() === 'STAT_CANCELED') {
					itemMetadataCollection[i] = [
						{
							attribute: 'DPCI',
							value: itemData.item.dpci,
						},
						{
							attribute: 'Cancel reason',
							value: `${itemData.fulfillment_spec.status.cancel_reason_code}<br />${itemData.fulfillment_spec.status.cancel_reason_text}<br />${itemData.fulfillment_spec.status.cancel_reason_code_description}`,
						},
						{
							attribute: 'Quantity limit',
							value: itemData.item.max_purchase_limit,
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
					attribute: 'Submitted date',
					value: dateFormatter.format(Date.parse(data.order.submitted)),
				},
				{
					attribute: 'Modified date',
					value: dateFormatter.format(Date.parse(data.order.modified)),
				},
				{
					attribute: 'ECC fraud indicator',
					value: data.order.callCenter.eccFraudIndicator,
				},
				{
					attribute: 'Payment authorization status',
					value: `${data.order.payments[0].authorizationStatus}<br />${data.order.payments[0].authorizationStatusDescription}`,
				},
				{
					attribute: 'Original payment amount',
					value: formatNumberAsCurrency(
						data.order.payments[0].authorizedAmount || data.order.payments[0].amount
					),
				},
				{
					attribute: 'Sales channel',
					value: data.order.client.salesChannel,
				},
			];

			for (let i = 0; i < data.order.items.length; i++) {
				const itemData = data.order.items[i];

				if (itemData.enterprise.status.toUpperCase() === 'CANCELLED') {
					itemMetadataCollection[i] = [
						{
							attribute: 'Cancel reason',
							value: `${itemData.enterprise.cancelReasonCode}<br />${itemData.enterprise.cancelReasonDescription}`,
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
		orderMetadataContainer.style.display = 'revert';
		if (Object.keys(itemMetadataCollection).length !== 0) itemMetadataContainer.style.display = 'revert';
	} catch (e) {
		console.error(e);
		displayError();
	}
})();
