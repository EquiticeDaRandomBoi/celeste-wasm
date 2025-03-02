import epoxyInit, { EpoxyClient, EpoxyClientOptions, EpoxyHandlers, EpoxyWebSocket, info as epoxyInfo } from "@mercuryworkshop/epoxy-tls/epoxy";
import EPOXY_PATH from "../../node_modules/@mercuryworkshop/epoxy-tls/full/epoxy.wasm?url"
import { store } from "./store";

export let epoxyVersion = epoxyInfo.version + epoxyInfo.commit + epoxyInfo.release;

let cache: Cache = await window.caches.open("epoxy");
let initted: boolean = false;

let currentClient: EpoxyClient;
let currentWispUrl: string;

async function evict() {
	await cache.delete(EPOXY_PATH);
}

async function instantiate() {
	if (!await cache.match(EPOXY_PATH)) {
		await cache.add(EPOXY_PATH);
	}
	const module = await cache.match(EPOXY_PATH);
	await epoxyInit({ module_or_path: module });
	initted = true;
}

async function tryInit() {
	if (!initted) {
		if (epoxyVersion === store.epoxyVersion) {
			await instantiate();
		} else {
			await evict();
			await instantiate();
			console.log(`evicted epoxy "${store.epoxyVersion}" from cache because epoxy "${epoxyVersion}" is available`);
			store.epoxyVersion = epoxyVersion;
		}
	}

	if (currentWispUrl !== store.wispServer) {
		await createEpoxy();
	}
}

export function getWispUrl() {
	return currentWispUrl;
}

export async function createEpoxy() {
	let options = new EpoxyClientOptions();
	options.user_agent = navigator.userAgent;
	options.udp_extension_required = false;

	currentWispUrl = store.wispServer || "wss://anura.pro/";
	currentClient = new EpoxyClient(currentWispUrl, options);
}

export async function epoxyFetch(url: string, options?: any): Promise<Response> {
	await tryInit();

	try {
		return await currentClient.fetch(url, options);
	} catch (err2) {
		let err = err2 as Error;
		console.log(err);

		throw err;
	}
}

const WebSocketFields = {
	prototype: {
		send: WebSocket.prototype.send,
	},
	CLOSED: WebSocket.CLOSED,
	CLOSING: WebSocket.CLOSING,
	CONNECTING: WebSocket.CONNECTING,
	OPEN: WebSocket.OPEN,
};

// from bare-mux
export class EpxWs extends EventTarget {
	url: string;
	readyState: number = WebSocketFields.CONNECTING;
	protocols: string | string[] | undefined;

	ws?: EpoxyWebSocket;

	constructor(remote: string | URL, protocols: string | string[] | undefined = []) {
		super();

		this.url = remote.toString();
		this.protocols = protocols;

		const onopen = () => {
			this.readyState = WebSocketFields.OPEN;

			const event = new Event("open")
			this.dispatchEvent(event);
		};

		const onmessage = async (payload: Uint8Array) => {
			const event = new MessageEvent("message", { data: payload });
			this.dispatchEvent(event);
		};

		const onclose = (code: number, reason: string) => {
			this.readyState = WebSocketFields.CLOSED;
			const event = new CloseEvent("close", { code, reason })
			this.dispatchEvent(event);
		};

		const onerror = () => {
			this.readyState = WebSocketFields.CLOSED;
			const event = new Event("error");
			this.dispatchEvent(event);
		};

		(async () => {
			await tryInit();
			const handlers = new EpoxyHandlers(onopen, onclose, onerror, onmessage);

			let protos;
			if (typeof protocols === "string") {
				protos = [protocols];
			} else {
				protos = protocols;
			}

			this.ws = await currentClient.connect_websocket(handlers, remote, protos, {});
		})();
	}

	send(...args: any[]) {
		if (this.readyState === WebSocketFields.CONNECTING || !this.ws) {
			throw new DOMException(
				"Failed to execute 'send' on 'WebSocket': Still in CONNECTING state."
			);
		}

		let data = args[0];
		if (data.buffer) data = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

		this.ws.send(data);
	}

	close(code: number, reason: string) {
		if (this.readyState === WebSocketFields.CONNECTING || !this.ws) {
			throw new DOMException(
				"Failed to execute 'close' on 'WebSocket': Still in CONNECTING state."
			);
		}

		this.ws.close(code, reason);
	}
}

(self as any).epoxyFetch = epoxyFetch;
