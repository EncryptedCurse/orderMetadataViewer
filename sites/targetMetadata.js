const orderNumberRegex = /(?:\/account\/orders\/)([0-9]+)/i;

chrome.storage.sync.get(['targetModule']).then((option) => {
	if (option.targetModule) trigger(orderNumberRegex);
});

const fetchOptions = {
	headers: {
		'accept': 'application/json',
		'accept-language': 'en-US,en;q=0.9',
		'group_by_return': 'true',
		'isgoh': 'false',
		'sec-fetch-dest': 'empty',
		'sec-fetch-mode': 'cors',
		'sec-fetch-site': 'same-site',
		'x-api-key': 'ff457966e64d5e877fdbad070f276d18ecec4a01',
	},
	referrer: `https://www.target.com/account/orders`,
	referrerPolicy: 'no-referrer-when-downgrade',
	method: 'GET',
	mode: 'cors',
	credentials: 'include',
};

function run(orderNumber) {
	fetch(`https://api.target.com/guest_order_aggregations/v1/${orderNumber}`, fetchOptions)
		.then((response) => response.json())
		.then((data) => {
			try {
				const options = await chrome.storage.sync.get(['clearConsole', 'logAll']);
				if (options.clearConsole) console.clear();
				if (options.logAll) console.log(data);

				// log order info
				const orderMetadataArray = [
					{ header: 'Order metadata' },
					{ title: 'Fraud status', text: data.fraud_status },
					{
						title: 'Authorization status',
						text: data.payment_transactions[0].authorization_status,
					},
					{ title: 'Soft decline', text: data.is_softdecline_order },
					{ title: 'Hard decline', text: data.is_payment_hard_declined },
				];
				log(orderMetadataArray);

				// log item info
				for (let i = 0; i < data.order_lines.length; i++) {
					const {
						fulfillment_spec: { status },
					} = data.order_lines[i];
					if (status.key === 'STAT_CANCELED') {
						const itemMetadataArray = [
							{ header: `Item ${i + 1}/${data.order_lines.length} metadata` },
							{
								title: 'Cancel reason:',
								text: `${status.cancel_reason_code} / ${status.cancel_reason_text} / ${status.cancel_reason_code_description}`,
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
