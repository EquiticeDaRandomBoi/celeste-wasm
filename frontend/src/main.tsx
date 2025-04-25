import { gameState, play, FpsView, GameView, LogView } from "./game/index";
import { Button, Dialog, Icon } from "./ui";
import { store } from "./store";

import { OpfsExplorer } from "./fs";
import { Achievements } from "./achievements";
import { ModInstaller } from "./modinstaller";
import { SteamCloud } from "./steam";
import { Settings } from "./settings";

import iconPlayArrow from "@ktibow/iconset-material-symbols/play-arrow";
import iconFullscreen from "@ktibow/iconset-material-symbols/fullscreen";
import iconLightMode from "@ktibow/iconset-material-symbols/light-mode";
import iconDarkMode from "@ktibow/iconset-material-symbols/dark-mode";
import iconFolderOpen from "@ktibow/iconset-material-symbols/folder-open";
import iconTrophy from "@ktibow/iconset-material-symbols/trophy";
import iconDownload from "@ktibow/iconset-material-symbols/download";
import iconTerminal from "@ktibow/iconset-material-symbols/terminal";
import iconSettings from "@ktibow/iconset-material-symbols/settings";

export const STEAM_ENABLED = import.meta.env.VITE_STEAM_ENABLED;

export const NAME = "webleste";

export const Logo: Component<{}, {}> = function() {
	this.css = `
		display: flex;
		align-items: center;
		font-size: 1.5rem;

		font-family: var(--font-display);
		color: var(--fg);

		&:hover {
		  color: var(--accent);
		}

		img {
			image-rendering: pixelated;
			-ms-interpolation-mode: nearest-neighbor;
			width: 3rem;
			height: 3rem;
		}

		.extras {
			align-self: start;
			padding: 0.25rem 0;
			font-size: 1rem;
			color: var(--fg6);

			display: flex;
			flex-direction: column;
			justify-content: space-between;
		}
	`;
	return (
		<a href="https://github.com/MercuryWorkshop/celeste-wasm" target="_blank">
			<img src="/app.ico" />
			<span>{NAME}</span>
			<div class="extras">
				<span class="ver">v1.4.0.0</span>
			</div>
		</a>
	)
}

const TopBar: Component<{
	canvas: HTMLCanvasElement,
	fsOpen: boolean,
	showLog: number,
	steamOpen: boolean,
	achievementsOpen: boolean,
	modInstallerOpen: boolean,
  settingsOpen: boolean,
}, { allowPlay: boolean, fps: HTMLElement }> = function() {
	this.css = `
		background: var(--bg);
		padding: 1em;
		border-bottom: 1.75px solid var(--surface2);
		transition: background 150ms, color 150ms, border-color 150ms;
		display: flex;
		align-items: stretch;
		width: 100%;
		gap: 0.5rem;

		flex: 0 0;

		.group {
			display: flex;
			align-items: center;
			gap: 1rem;
		}

		.expand { flex: 1; }

		@media (max-width: 750px) {
			& {
				flex-direction: column;
			}
			.group {
				justify-content: space-evenly;
			}
		}
	`;

	useChange([gameState.ready, gameState.playing], () => {
		this.allowPlay = gameState.ready && !gameState.playing;
	});

	return (
		<div>
			<div class="group">
				<Logo />
			</div>
			<div class="expand" />
			<div class="group">
				<Button on:click={() => this.modInstallerOpen = true} icon="left" type="normal" disabled={false} title={"Download Mods"}>
					<Icon icon={iconDownload} />
					<span>Mods</span>
				</Button>
        <Button on:click={() => this.steamOpen = true} icon="full" type="normal" disabled={false} title={"Log in to Steam"}>
					steam icon
				</Button>
        <Button on:click={() => this.achievementsOpen = true} icon="full" type="normal" disabled={false} title={"Achievements"}>
					<Icon icon={iconTrophy} />
				</Button>
        <Button on:click={() => this.fsOpen = true} icon="full" type="normal" disabled={false} title={"File Browser"}>
					<Icon icon={iconFolderOpen} />
				</Button>
        <Button on:click={() => {
          if (store.theme === "light") {
            store.theme = "dark";
          } else {
            store.theme = "light";
          }
        }} icon="full" type="normal" disabled={false} bind:title={use(store.theme, x => x === "light" ? "Switch to Dark Mode" : "Switch to Light Mode")}>
					<Icon icon={use(store.theme, x => x === "light" ? iconDarkMode : iconLightMode)} />
				</Button>
        <Button icon="full" type="normal" disabled={false} title="Settings" on:click={() => { this.settingsOpen = true }}><Icon icon={iconSettings} /></Button>
				<Button
          icon="full" type="normal" disabled={false} bind:title={use(this.showLog, x=> x > 0 ? "Hide Logs" : "Show Logs")}
					on:click={() => {
						this.showLog = -this.showLog;
					}}>
					<Icon icon={iconTerminal} />
				</Button>
				<Button on:click={async () => {
					try {
						await this.canvas.requestFullscreen({ navigationUI: "hide" });
					} catch { }
				}} icon="full" type="normal" disabled={use(gameState.playing, x => !x)} title={"Fullscreen"}>
					<Icon icon={iconFullscreen} />
				</Button>
				<Button on:click={() => {
					play();
				}} icon="left" type="primary" disabled={use(this.allowPlay, x => !x)} title={"Start Game"}>
					<Icon icon={iconPlayArrow} />
					<span>Play</span>
				</Button>
			</div>
		</div>
	)
}

export const Main: Component<{}, {
	canvas: HTMLCanvasElement,
	fsOpen: boolean,
	achievementsOpen: boolean,
	modInstallerOpen: boolean,
	steamOpen: boolean,
	settingsOpen: boolean,
	logcontainer: HTMLDivElement,
}> = function() {
	this.css = `
		width: 100%;
		height: 100%;
		background: var(--bg-sub);
		color: var(--fg);

		display: flex;
		flex-direction: column;
		align-items: center;

		transition: background 150ms, color 150ms;

		.game {
			aspect-ratio: 16 / 9;
			flex: 0 1 min(calc(9 * 100vw / 16), 100vh);
		}

		.logs {
			display: flex;
			flex-direction: column;

			width: 100%;
			padding: 0 0.5em 0.5em 0.5em;

			background: var(--bg-sub);
		}

		.resizer {
			background: var(--surface1);
			cursor: ns-resize;
			width: 100%;
			flex: 0 0 0.25em;
		}

		.main h2 {
			margin: 0;
		}

		.expand { flex: 1; }
	`;

	this.fsOpen = false;
	this.achievementsOpen = false;

	this.mount = () => {
		useChange([store.logs], x => {
			this.logcontainer.style.height = `${x}px`;
		});
	}

	return (
		<div>
			<TopBar
				canvas={use(this.canvas)}
				bind:fsOpen={use(this.fsOpen)}
				bind:achievementsOpen={use(this.achievementsOpen)}
				bind:steamOpen={use(this.steamOpen)}
				bind:modInstallerOpen={use(this.modInstallerOpen)}
				bind:settingsOpen={use(this.settingsOpen)}
				bind:showLog={use(store.logs)}
			/>
			<div class="game">
				<GameView bind:canvas={use(this.canvas)} />
			</div>
			<div class="expand" />
			{$if(use(store.logs, x => x > 0), /* @ts-expect-error */
				<>
					<div class="resizer"
						on:mousedown={(e: MouseEvent) => {
							const startY = e.clientY;
							const startHeight = this.logcontainer.clientHeight;
							let height: number;
							const onMouseMove = (e: MouseEvent) => {
								height = startHeight + startY - e.clientY;
								this.logcontainer.style.height = `${height}px`;
							}
							const onMouseUp = () => {
								document.removeEventListener("mousemove", onMouseMove);
								document.removeEventListener("mouseup", onMouseUp);
								store.logs = height;
							}
							document.addEventListener("mousemove", onMouseMove);
							document.addEventListener("mouseup", onMouseUp);
						}}></div>
					<div class="logs" bind:this={use(this.logcontainer)}>
						<LogView scrolling={true} />
					</div>
				</>
			)}
			<Dialog name="Steam Cloud" bind:open={use(this.steamOpen)}>
				<SteamCloud open={use(this.steamOpen)} />
			</Dialog>
			<Dialog name="File System" bind:open={use(this.fsOpen)}>
				<OpfsExplorer open={use(this.fsOpen)} />
			</Dialog>
			<Dialog name="Achievements" bind:open={use(this.achievementsOpen)}>
				<Achievements open={use(this.achievementsOpen)} />
			</Dialog>
			<Dialog name="Mod Installer" bind:open={use(this.modInstallerOpen)}>
				<ModInstaller open={use(this.modInstallerOpen)} />
			</Dialog>
			<Dialog name="Settings" bind:open={use(this.settingsOpen)}>
			  <Settings />
			</Dialog>
		</div>
	);
}
