let blazor;
let resources;

self.addEventListener("activate", (e) => {
	e.waitUntil((async () => {
		blazor = await fetch("/_framework/blazor.boot.json").then(r => r.json());
		if (!blazor.resources) throw new Error("blazor.boot.json did not have resources");
		if (!blazor.resources.fingerprinting) throw new Error("blazor.boot.json did not have fingerprinting");

		resources = Object.fromEntries(Object.entries(blazor.resources.fingerprinting).map(([k, v]) => [v, k]));
		console.log("got resources:", resources);
		await clients.claim();
		const clientList = await clients.matchAll();
		for (const client of clientList) {
			client.postMessage({ done: true });
		}
	})());
});

self.addEventListener("fetch", (e) => {
	e.respondWith((async () => {
		const url = new URL(e.request.url);
		if (e.request.method === "GET" && url.pathname.startsWith("/dlls/")) {
			const resource = url.pathname.substring("/dlls/".length);

			console.log("looking up", resource);
			const remapped = resources[resource];

			if (remapped) {
				console.log("fetching", remapped);
				return fetch("/_framework/" + remapped);
			} else {
				return new Response("Resource not found in blazor.boot.json", { status: 404, statusText: "Not Found" });
			}
		} else {
			return fetch(e.request);
		}
	})());
});
