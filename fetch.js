#!/usr/bin/env node

const request = (method, url, headers, body = null) => 
	new Promise((resolve, reject) => 
		(url.startsWith('https://') ? require('https').request : require('http').request)
		(Object.assign(require('url').parse(url), {method, headers}))
		.on('response', response => resolve(response))
		.on('error', error => reject(error))
		.end(body)
	)
	.then(response => 
		[201, 301, 302, 303, 307, 308].includes(response.statusCode) ? 
		request(method, require('url').parse(url).resolve(response.headers.location), headers, body) : 
		Object.assign(response, {json: () => new Promise((resolve, reject) => {
			let chunks = []
			response
			.on('data', chunk => chunks.push(chunk))
			.on('end', () => resolve(Buffer.concat(chunks)))
			.on('error', error => reject(error))
		})
		.then(body => JSON.parse(body))})
	)


Promise.resolve()
.then(() => request('GET', 'https://v2.jinrishici.com/token'))
.then(response => response.statusCode === 200 ? response : Promise.reject(response.statusCode))
.then(response => response.json())
.then(data => request('GET', 'https://v2.jinrishici.com/sentence', {
	'X-User-Token': data['data']
}))
.then(response => response.statusCode === 200 ? response : Promise.reject(response.statusCode))
.then(response => response.pipe(require('fs').createWriteStream('./public/data.json')))
