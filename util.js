const styles = {
	header: 'font-weight: bold',
	title: 'font-style: italic',
	reset: 'all: unset',
};

const failMessage = '❌ Failed to display order metadata!';

function untilNotNull(condition) {
	return new Promise((resolve) => {
		let interval = setInterval(() => {
			const result = condition();
			if (!result) {
				return;
			} else {
				clearInterval(interval);
				resolve(result);
			}
		}, 200);
	});
}

function trigger(orderNumberRegex) {
	document.addEventListener('DOMContentLoaded', async () => {
		await untilNotNull(() => window.location.pathname.match(orderNumberRegex)).then((orderNumberMatch) =>
			run(orderNumberMatch[1])
		);
	});
}

function log(objArray) {
	let strArray = [],
		argsArray = [];

	for (const obj of objArray) {
		if (obj) {
			if (obj.hasOwnProperty('header')) {
				strArray.push(`%c${obj.header}%c`);
				argsArray.push(styles.header, styles.reset);
			} else if (obj.hasOwnProperty('title')) {
				strArray.push(`%c• ${obj.title}:%c ${obj.text}`);
				argsArray.push(styles.title, styles.reset);
			}
		}
	}

	console.log(strArray.join('\n'), ...argsArray);
}
