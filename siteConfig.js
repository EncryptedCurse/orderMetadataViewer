export const targetConfig = {
	urlRegex: /(?:https?:\/\/.*target\.com\/account\/orders\/)([0-9]{13})/i,
	apiEndpoint: 'https://api.target.com/guest_order_aggregations/v1',
	fetchOptions: {
		headers: {
			'accept': 'application/json',
			'accept-language': 'en-US,en;q=0.9',
			// API-specific headers
			'x-api-key': 'ff457966e64d5e877fdbad070f276d18ecec4a01',
			'group_by_return': 'true',
			'isgoh': 'false',
		},
		referrer: `https://www.target.com/account/orders`,
		credentials: 'include',
	},
};

export const bestBuyConfig = {
	urlRegex: /(?:https?:\/\/.*bestbuy\.com\/profile\/ss\/orders\/order-details\/)(BBY[0-9]{2}-[0-9]{12})/i,
	apiEndpoint: 'https://www.bestbuy.com/profile/ss/api/v1/orders',
	fetchOptions: {
		headers: {
			'accept': 'application/json,text/javascript,*/*;q=0.01',
			'accept-language': 'en-US,en;q=0.9',
		},
		referrer: 'https://www.bestbuy.com/profile/ss/orders/order-details/',
		credentials: 'include',
	},
};
