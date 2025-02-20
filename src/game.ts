import { RingBuffer } from "ring-buffer-ts";
import { DotnetHostBuilder } from "./dotnet";
import { libcurl } from "libcurl.js";
import { rootFolder } from "./fs";

export type Log = { color: string, log: string };
export const TIMEBUF_SIZE = 120;
export const gameState: Stateful<{
	ready: boolean,
	playing: boolean,

	// these will NOT work with use()
	logbuf: Log[],
	timebuf: RingBuffer<number>,
}> = $state({
	ready: false,
	playing: false,
	logbuf: [],
	timebuf: new RingBuffer<number>(TIMEBUF_SIZE)
});

function proxyConsole(name: string, color: string) {
	// @ts-expect-error ts sucks
	const old = console[name].bind(console);
	// @ts-expect-error ts sucks
	console[name] = (...args) => {
		let str;
		try {
			str = args.join(" ");
		} catch {
			str = "<failed to render>";
		}
		old(...args);
		gameState.logbuf.push({
			color,
			log: `[${new Date().toISOString()}]: ${str}`
		});
		gameState.logbuf = gameState.logbuf;
	}
}
proxyConsole("error", "var(--error)");
proxyConsole("warn", "var(--warning)");
proxyConsole("log", "var(--fg)");
proxyConsole("info", "var(--info)");
proxyConsole("debug", "var(--fg6)");

function hookfmod() {
	let contexts: AudioContext[] = [];

	let ctx = AudioContext;
	(AudioContext as any) = function() {
		let context = new ctx();

		contexts.push(context);
		return context;
	};

	window.addEventListener("focus", async () => {
		for (let context of contexts) {
			try {
				await context.resume();
			} catch { }
		}
	});
	window.addEventListener("blur", async () => {
		for (let context of contexts) {
			try {
				await context.suspend();
			} catch { }
		}
	});
}
hookfmod();

const wasm = await eval(`import("/_framework/dotnet.js")`);
const dotnet: DotnetHostBuilder = wasm.dotnet;
let exports: any;

export async function getDlls(): Promise<(readonly [string, string])[]> {
	const resources: any = await fetch("/_framework/blazor.boot.json").then(r => r.json());
	const whitelist = [
		"netstandard.dll",
		"mscorlib.dll",
		"System.Collections.Concurrent.dll",
		"System.Memory.dll",
		"System.Private.CoreLib.dll",
		"System.Private.Uri.dll",
		"System.Runtime.dll",
		"System.Reflection.dll",
		"System.Runtime.InteropServices.dll",
		"System.Text.RegularExpressions.dll",

		"NETCoreifier.dll",
		"FNA.dll",
		"Wasm.Celeste.dll",
		"Celeste.Wasm.mm.dll",

		"MonoMod.Common.dll",
		"MonoMod.Patcher.dll",
		"MonoMod.ILHelpers.dll",
		"MonoMod.Backports.dll",
		"MonoMod.Utils.dll",
		"Mono.Cecil.dll",
	];

	return Object.entries(resources.resources.fingerprinting).map(x => [x[0] as string, x[1] as string] as const).filter(([_, v]) => whitelist.includes(v));
}

const wisp_url = "wss://anura.pro/wisp/";

// the funny custom rsa
// https://github.com/MercuryWorkshop/wispcraft/blob/main/src/connection/crypto.ts
function encryptRSA(data: Uint8Array, n: bigint, e: bigint): Uint8Array {
	const modExp = (base: bigint, exp: bigint, mod: bigint) => {
		let result = 1n;
		base = base % mod;
		while (exp > 0n) {
			if (exp % 2n === 1n) {
				result = (result * base) % mod;
			}
			exp = exp >> 1n;
			base = (base * base) % mod;
		}
		return result;
	};
	// thank you jippity
	const pkcs1v15Pad = (messageBytes: Uint8Array, n: bigint) => {
		const messageLength = messageBytes.length;
		const nBytes = Math.ceil(n.toString(16).length / 2);

		if (messageLength > nBytes - 11) {
			throw new Error("Message too long for RSA encryption");
		}

		const paddingLength = nBytes - messageLength - 3;
		const padding = Array(paddingLength).fill(0xff);

		return BigInt(
			"0x" +
			[
				"00",
				"02",
				...padding.map((byte) => byte.toString(16).padStart(2, "0")),
				"00",
				...Array.from(messageBytes).map((byte: any) =>
					byte.toString(16).padStart(2, "0")
				),
			].join("")
		);
	};
	const paddedMessage = pkcs1v15Pad(data, n);
	let int = modExp(paddedMessage, e, n);

	let hex = int.toString(16);
	if (hex.length % 2) {
		hex = "0" + hex;
	}

	// ????
	return new Uint8Array(
		Array.from(hex.match(/.{2}/g) || []).map((byte) => parseInt(byte, 16))
	);
}

export async function downloadEverest() {
	const branch = "stable"
	const res = await fetch("https://everestapi.github.io/everestupdater.txt");
	const versionsUrl = await res.text();
	const versRes = await fetch(versionsUrl);

	const versions = await versRes.json();
	const build = versions.filter((v: any) => v.branch == branch)[0];

	console.log(`Installing Everest ${branch} ${build.commit} ${build.date}`);
	console.log("Downloading Everest from", build.mainDownload);
	const zipres = await fetch(build.mainDownload);
	const zipbin = await zipres.arrayBuffer();

	const file = await rootFolder.getFileHandle("everest.zip", { create: true });
	const writable = await file.createWritable();
	await writable.write(new Uint8Array(zipbin));
	await writable.close();

	console.log("Successfully downloaded Everest");
}

export async function preInit() {
	console.debug("initializing dotnet");
	const runtime = await dotnet.withConfig({
		pthreadPoolInitialSize: 24
	}).create();

	console.log("loading libcurl");
	// TODO: replace with epoxy
	await libcurl.load_wasm("https://cdn.jsdelivr.net/npm/libcurl.js@0.7.0/libcurl.wasm");
	libcurl.set_websocket(wisp_url);

	window.WebSocket = new Proxy(WebSocket, {
		construct(t, a, n) {
			if (a[0] === wisp_url)
				return Reflect.construct(t, a, n);

			return new libcurl.WebSocket(...a);
		}
	});

	let nativefetch = window.fetch;
	window.fetch = async (...args) => {
		try {
			return await nativefetch(...args);
		} catch (e) {
			return await libcurl.fetch(...args);
		}
	}

	const config = runtime.getConfig();
	exports = await runtime.getAssemblyExports(config.mainAssemblyName!);


	// TODO: replace with native openssl
	runtime.setModuleImports("interop.js", {
		encryptrsa: (publicKeyModulusHex: string, publicKeyExponentHex: string, data: Uint8Array) => {
			let modulus = BigInt("0x" + publicKeyModulusHex);
			let exponent = BigInt("0x" + publicKeyExponentHex);
			let encrypted = encryptRSA(data, modulus, exponent);
			return new Uint8Array(encrypted);
		}
	});

	runtime.setModuleImports("depot.js", {
		newqr: (qr: string) => {
			console.log("QR DATA" + qr);
			// gameState.qr = qr;
		}
	});

	(self as any).wasm = {
		Module: runtime.Module,
		dotnet,
		runtime,
		config,
		exports,
	};

	const dlls = await getDlls();

	console.debug("PreInit...");
	await runtime.runMain();
	await exports.CelesteBootstrap.MountFilesystems(dlls.map(x => `${x[0]}|${x[1]}`));
	await exports.Celeste.PreInit();
	console.debug("dotnet initialized");

	try {
		await rootFolder.getFileHandle("Celeste.Mod.mm.dll", { create: false });
	} catch {
		try {
			await rootFolder.getFileHandle("everest.zip", { create: false });
		} catch {
			await downloadEverest();
		}
		await exports.AotPatcher.ExtractEverest();
	}

	console.log("attempting to patch celeste");
	await exports.AotPatcher.PatchCeleste();


	/*
	if (await exports.Program.InitSteamSaved() == 0) {
		console.log("Steam saved login success");
	}
	*/

	gameState.ready = true;
};

export async function play() {
	gameState.playing = true;

	const before = performance.now();
	console.debug("Init...");
	await exports.Celeste.Init();
	const after = performance.now();
	console.debug(`Init : ${(after - before).toFixed(2)}ms`);

	console.debug("MainLoop...");
	const main = async () => {
		const before = performance.now();
		const ret = await exports.Celeste.MainLoop();
		const after = performance.now();

		gameState.timebuf.add(after - before);

		if (!ret) {
			console.debug("Cleanup...");

			gameState.timebuf.clear();

			await exports.Celeste.Cleanup();
			gameState.ready = false;
			gameState.playing = false;

			return;
		}

		requestAnimationFrame(main);
	}
	requestAnimationFrame(main);
}

useChange([gameState.playing], () => {
	try {
		if (gameState.playing) {
			// @ts-expect-error
			navigator.keyboard.lock()
		} else {
			// @ts-expect-error
			navigator.keyboard.unlock();
		}
	} catch (err) { console.log("keyboard lock error:", err); }
});

document.addEventListener("keydown", (e: KeyboardEvent) => {
	if (gameState.playing && ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.code)) {
		e.preventDefault();
	}
});
