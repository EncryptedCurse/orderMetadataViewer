const orderNumberRegex = /(?:\/profile\/ss\/orders\/order-details\/)(BBY01-[0-9]+)/i;

chrome.storage.sync.get(['bestBuyModule']).then((option) => {
	if (option.bestBuyModule) trigger(orderNumberRegex);
});

const fetchOptions = {
	headers: {
		'accept': 'application/json, text/javascript, */*; q=0.01',
		'accept-language': 'en-US,en;q=0.9',
		'sec-fetch-dest': 'empty',
		'sec-fetch-mode': 'cors',
		'sec-fetch-site': 'same-origin',
		'x-pr-id':
			'D1CNJ0W0ep1KE0FoUOJCUy66qdx7aJJ0JX92SR447Shros341mXlfzPC5OVUWaOBa33WXA1s5o6HdQQ3GR8yzqPcYz6TECbzkwrJlIGf3dxYD9RJ9zVX2jNKRVwFeSgtwSZml7S+iw8jMbvMBHrE0w==',
	},
	referrer: 'https://www.bestbuy.com/profile/ss/orders/order-details/',
	referrerPolicy: 'strict-origin-when-cross-origin',
	method: 'GET',
	mode: 'cors',
	credentials: 'include',
};

function run(orderNumber) {
	fetch(`https://www.bestbuy.com/profile/ss/api/v1/orders/${orderNumber}`, fetchOptions)
		.then((response) => response.json())
		.then(async (data) => {
			try {
				const options = await chrome.storage.sync.get(['clearConsole', 'logAll']);
				if (options.clearConsole) console.clear();
				if (options.logAll) console.log(data);

				// log order info
				const orderMetadataArray = [
					{ header: 'Order metadata' },
					data.customer.status === 'AUTHENTICATED'
						? {
								title: 'Authorization status',
								text: `${data.order.payments[0].authorizationStatus} / ${data.order.payments[0].authorizationStatusDescription}`,
						  }
						: undefined,
					{ title: 'ECC fraud indicator', text: data.order.callCenter.eccFraudIndicator },
				];
				log(orderMetadataArray);

				// log item info
				for (let i = 0; i < data.order.items.length; i++) {
					const { enterprise } = data.order.items[i];
					if (enterprise.status === 'Cancelled') {
						const itemMetadataArray = [
							{ header: `Item ${i + 1}/${data.order.items.length} metadata` },
							{
								title: 'Cancel reason',
								text: `${enterprise.cancelReasonCode} / ${enterprise.cancelReasonDescription}`,
							},
						];
						log(itemMetadataArray);
					}
				}
			} catch (e) {
				console.log(failMessage, '\n', e);
			}
		});
}
