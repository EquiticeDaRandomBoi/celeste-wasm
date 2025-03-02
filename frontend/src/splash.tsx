import { Logo, STEAM_ENABLED } from "./main";
import { Button, Icon, Link } from "./ui";
import { copyFile, copyFolder, countFolder, hasContent, PICKERS_UNAVAILABLE, rootFolder } from "./fs";

import iconFolderOpen from "@ktibow/iconset-material-symbols/folder-open-outline";
import iconDownload from "@ktibow/iconset-material-symbols/download";
import iconEncrypted from "@ktibow/iconset-material-symbols/encrypted";
import { downloadApp, gameState, initSteam, PatchCeleste } from "./game/dotnet";
import { SteamLogin } from "./steam";
import { LogView } from "./game";

const validateDirectory = async (directory: FileSystemDirectoryHandle) => {
	let content;
	try {
		content = await directory.getDirectoryHandle("Content", { create: false });
	} catch {
		return `Failed to find Content directory in selected folder`
	}

	for (const child of ["Dialog", "Effects", "FMOD", "Graphics", "Maps", "Monocle", "Overworld", "Tutorials"]) {
		try {
			await content.getDirectoryHandle(child, { create: false });
		} catch {
			return `Failed to find subdirectory Content/${child}`
		}
	}

	try {
		await directory.getFileHandle("Celeste.exe", { create: false });
	} catch {
		try {
			const orig = await directory.getDirectoryHandle("orig", { create: false });
			await orig.getFileHandle("Celeste.exe", { create: false });
		} catch {
			return `Failed to find Celeste.exe in selected folder`
		}
	}

	return "";
};

const Intro: Component<{
	"on:next": (type: "copy" | "download") => void,
}, {}> = function() {
	this.css = `
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		
		.error {
			margin-block: 0.3em;
		}
		
		p {
			margin-block: 0.3em;
		}
	`;

	return (
		<div>
			<p>
				This is a mostly-complete port of <Link href="https://www.celestegame.com/">Celeste</Link> to the browser using <b>dotnet 9's threaded WASM support</b>.
				It also uses <Link href="https://github.com/r58playz/monomod">r58Playz's <b>MonoMod WASM port</b></Link> to patch the game dynamically.
				It needs around 0.6GB of memory and will probably not work on low-end devices.
			</p>
			<p>
				You will need to own Celeste to play this
			</p>
			<p>
				The background is from <Link href="https://www.fangamer.com/products/celeste-desk-mat-skies">fangamer merch</Link>.
			</p>
			{PICKERS_UNAVAILABLE ?
				<div class="error">
					Your browser does not support the
					{' '}<Link href="https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker">File System Access API</Link>.{' '}
					You will be unable to copy your Celeste assets to play or use the upload features in the filesystem viewer.
				</div>
				: null}
			{STEAM_ENABLED ? null :
				<div class="warning">
					<span>This deployment of celeste-wasm does not have encrypted assets. You cannot download and decrypt them to play.</span>
				</div>}
			{PICKERS_UNAVAILABLE && !STEAM_ENABLED ?
				<div class="error">
					You will have to switch browsers (to a Chromium-based one) to play as both methods of getting Celeste assets are unavailable.
				</div>
				: null}

			<Button on:click={() => this["on:next"]("copy")} type="primary" icon="left" disabled={PICKERS_UNAVAILABLE}>
				<Icon icon={iconFolderOpen} />
				{PICKERS_UNAVAILABLE ? "Copying local Celeste assets is unsupported" : "Copy local Celeste assets"}
			</Button>
			<Button on:click={() => this["on:next"]("download")} type="primary" icon="left" disabled={false}>
				<Icon icon={iconDownload} />
				{STEAM_ENABLED ? "Download assets with Steam Login" : "Download through Steam is disabled"}
			</Button>
		</div>
	)
}

const Progress: Component<{ percent: number }, {}> = function() {
	this.css = `
		background: var(--surface1);
		border-radius: 1rem;
		height: 1rem;

		.bar {
			background: var(--accent);
			border-radius: 1rem;
			height: 1rem;
			transition: width 250ms;
		}
	`;

	return (
		<div><div class="bar" style={use`width:${this.percent}%`} /></div>
	)
}

const Copy: Component<{
	"on:done": () => void,
}, {
	copying: boolean,
	os: string,
	status: string,
	percent: number,
}> = function() {
	this.css = `
		display: flex;
		flex-direction: column;
		gap: 0.5rem;

		code {
			overflow-wrap: break-word;
		}
	`;

	const opfs = async () => {
		const directory = await showDirectoryPicker();
		const res = await validateDirectory(directory);
		if (res) {
			this.status = res;
			return;
		}

		const contentFolder = await directory.getDirectoryHandle("Content", { create: false });

		const max = await countFolder(contentFolder);
		let cnt = 0;
		this.copying = true;
		const before = performance.now();
		await copyFolder(contentFolder, rootFolder, (x) => {
			cnt++;
			this.percent = cnt / max * 100;
			console.debug(`copied ${x}: ${(cnt / max * 100).toFixed(2)}`);
		});
		const after = performance.now();
		console.debug(`copy took ${(after - before).toFixed(2)}ms`);

		let celesteExe;
		try {
			celesteExe = await directory.getFileHandle("Celeste.exe", { create: false });
		} catch {
			let orig = await directory.getDirectoryHandle("orig", { create: false });
			celesteExe = await orig.getFileHandle("Celeste.exe", { create: false });
		}
		await copyFile(celesteExe, rootFolder);

		await new Promise(r => setTimeout(r, 250));
		await rootFolder.getFileHandle(".ContentExists", { create: true });
		this["on:done"]();
	}

	let ua = navigator.userAgent;
	this.os = "";
	if (ua.includes("Win")) {
		this.os = "win";
	} else if (ua.includes("Mac")) {
		this.os = "darwin";
	} else if (ua.includes("Linux")) {
		this.os = "linux";
	}

	return (
		<div>
			<div>
				Select your Celeste install's directory. It will be copied to browser storage and can be removed in the file manager.
			</div>
			{this.os == "win" ? (<div>
				The directory for Steam installs of Celeste is usually located in <code>C:\Program Files (x86)\Steam\steamapps\common\Celeste</code>.
			</div>) : null}
			{this.os == "darwin" ? (
				<div>
					<p>
						The directory for Steam installs of Celeste is usually located in <code>~/Library/Application Support/Steam/steamapps/common/Celeste/Celeste.app/Contents/Resources</code>.
					</p>
					<p class="warning">
						If you get an error stating it can't open the folder because it "contains system files", try copying it to another location first.
					</p>
				</div>
			) : null}
			{this.os == "linux" ? (<div>
				<p>
					The directory for Steam installs of Celeste is usually located in <code>~/.steam/root/steamapps/common/Celeste</code>.
				</p>
				<p class="warning">
					If you get an error stating it can't open the folder because it "contains system files", try copying it to another location first.
				</p>
			</div>) : null}
			{this.os == "" ? (<div>
				The directory for Steam installs of Celeste is usually located in one of these locations:
				<ul>
					<li><code>~/.steam/root/steamapps/common/Celeste</code></li>
					<li><code>C:\Program Files (x86)\Steam\steamapps\common\Celeste</code></li>
					<li><code>~/Library/Application Support/Steam/steamapps/common/Celeste/Celeste.app/Contents/Resources</code></li>
				</ul>
			</div>) : null}
			{$if(use(this.copying), <Progress percent={use(this.percent)} />)}
			<Button on:click={opfs} type="primary" icon="left" disabled={use(this.copying)}>
				<Icon icon={iconFolderOpen} />
				Select Celeste directory
			</Button>
			{$if(use(this.status), <div class="error">{use(this.status)}</div>)}
		</div>
	)
}

export const Download: Component<{
	"on:done": () => void,
}, {
	downloading: boolean,
	downloadDisabled: boolean,
	status: string,
	percent: number,
	input: HTMLInputElement,

}> = function() {
	this.css = `
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
		font-size: 15pt;

		.console {
			font-size: initial;
			height: 10em;
		}
	`;

	useChange([this.downloading, gameState.loginstate], () => {
		this.downloadDisabled = this.downloading || gameState.loginstate != 2;
	});

	const download = async () => {
		this.downloading = true;
		let result = await downloadApp();
		this.downloading = false;
		if (result) {
			await rootFolder.getFileHandle(".ContentExists", { create: true });
			this["on:done"]();
		} else {
			console.error("FAILED TO DOWNLOAD. TRY RELOADING");
		}
	};

	return (
		<div>
			{$if(use(gameState.ready),
				<div>
					{$if(use(gameState.loginstate, l => l == 2),
						<div>
							<p>Logged into steam successfully!</p>
							<Button type="primary" icon="left" disabled={use(this.downloadDisabled)} on:click={download}>
								<Icon icon={iconEncrypted} />
								Download Assets
							</Button>
						</div>,
						<SteamLogin />
					)}

					{$if(use(this.downloading), <Progress percent={use(this.percent)} />)}
				</div>,
				<div class="loading">
					<p>Initializing Connection to Steam...</p>
				</div>
			)}

			<div class="console">
				<LogView scrolling={false} />
			</div>
		</div>
	)
}

export const Patch: Component<{
	"on:done": () => void,
}, {
	patching: boolean,
}> = function() {
	this.patching = false;
	this.css = `
		display: flex;
		flex-direction: column;
		gap: 1rem;
		.console {
			font-size: initial;
			height: 10em;
		}
	`
	const patch = async () => {
		this.patching = true;
		await PatchCeleste();
		this.patching = false;
		this["on:done"]();
	}

	return <div>
		<p>We're going to patch Celeste with MonoMod for neccesary webassembly fixes. You also have the option to install the Everest Mod Loader, but it will take longer to install</p>
		<div>
			<input type="checkbox" id="installEverest" />
			<label for="installEverest">Install Everest Mod Loader?</label>
		</div>

		<Button type="primary" icon="left" on:click={patch} disabled={use(this.patching)}>
			Patch Celeste
		</Button>

		<div class="console">
			<LogView minimal={true} scrolling={false} />
		</div>
	</div>
}

const initialHasContent = await hasContent();
let initialIsPatched = false;
try {
	await rootFolder.getFileHandle("CustomCeleste.dll", { create: false });
	initialIsPatched = true;
} catch { }

export const Splash: Component<{
	"on:next": (animation: boolean) => void,
}, {
	next: "" | "copy" | "download" | "patch",
}> = function() {
	this.css = `
		position: relative;

		.splash, .blur, .main {
			position: absolute;
			width: 100%;
			height: 100%;
			top: 0;
			left: 0;
		}

		.splash {
			object-fit: cover;
			z-index: 1;
		}

		.blur {
			backdrop-filter: blur(0.5vw);
			background-color: color-mix(in srgb, var(--bg) 40%, transparent);
			z-index: 2;
		}

		.main {
			display: flex;
			align-items: center;
			justify-content: center;
			z-index: 3;
		}

		.container {
			backdrop-filter: blur(0.5vw);
			background-color: color-mix(in srgb, var(--bg) 80%, transparent);
			width: min(40rem, 100%);
			margin: 0 1rem;
			padding: 1.3em;
			border-radius: 1.5rem;

			color: var(--fg);

			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}

		.logo {
			display: flex;
			justify-content: center;
		}
	`;

	if (initialHasContent) {
		if (initialIsPatched) {
			queueMicrotask(() => this["on:next"](false));
		} else {
			this.next = "patch";
		}
	} else {
		this.next = "";
	}

	return (
		<div>
			<img class="splash" src="/splash.png" />
			<div class="blur" />
			<div class="main">
				<div class="container">
					<div class="logo">
						<Logo />
					</div>
					{use(this.next, x => {
						if (!x) {
							return <Intro on:next={(x) => this.next = x} />;
						} else if (x === "copy") {
							return <Copy on:done={() => this.next = "patch"} />;
						} else if (x === "download") {
							return <Download on:done={() => this.next = "patch"} />;
						} else if (x === "patch") {
							return <Patch on:done={() => this["on:next"](true)} />;
						}
					})}
				</div>
			</div>
		</div>
	)
}
