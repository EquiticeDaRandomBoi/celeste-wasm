import { gameState, play, FpsView, GameView, LogView } from "./game/index";
import { Button, Dialog, Icon } from "./ui";
import { store } from "./store";
import { OpfsExplorer } from "./fs";
import { Achievements } from "./achievements";
import { ModInstaller } from "./modinstaller";

import iconPlayArrow from "@ktibow/iconset-material-symbols/play-arrow";
import iconFullscreen from "@ktibow/iconset-material-symbols/fullscreen";
import iconLightMode from "@ktibow/iconset-material-symbols/light-mode";
import iconDarkMode from "@ktibow/iconset-material-symbols/dark-mode";
import iconFolderOpen from "@ktibow/iconset-material-symbols/folder-open";
import iconTrophy from "@ktibow/iconset-material-symbols/trophy";
import iconDownload from "@ktibow/iconset-material-symbols/download";
import iconTerminal from "@ktibow/iconset-material-symbols/terminal";

export const STEAM_ENABLED = import.meta.env.VITE_STEAM_ENABLED;

export const NAME = "webleste";

export const Logo: Component<{}, {}> = function() {
	this.css = `
		display: flex;
		align-items: center;
		font-size: 1.5rem;

		font-family: var(--font-display);
		color: var(--fg);

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
		<a href="https://github.com/MercuryWorkshop/celeste-wasm">
			<img src="/app.ico" />
			<span>{NAME}</span>
			<div class="extras">
				<span>v1.4.0.0</span>
			</div>
		</a>
	)
}

const TopBar: Component<{
	canvas: HTMLCanvasElement,
	fsOpen: boolean,
	showLog: boolean,
	achievementsOpen: boolean,
	modInstallerOpen: boolean,
}, { allowPlay: boolean, fps: HTMLElement }> = function() {
	this.css = `
		background: var(--bg);
		padding: 1em;
		border-bottom: 2px solid var(--surface1);
		transition: background 200ms, color 200ms, border-color 200ms;
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
				{$if(use(gameState.playing), <FpsView />)}
			</div>
			<div class="expand" />
			<div class="group">
				<Button on:click={() => this.modInstallerOpen = true} icon="left" type="normal" disabled={false}>
					<Icon icon={iconDownload} />
					<span>Mods</span>
				</Button>
				<Button on:click={() => this.achievementsOpen = true} icon="full" type="normal" disabled={false}>
					<Icon icon={iconTrophy} />
				</Button>
				<Button on:click={() => this.fsOpen = true} icon="full" type="normal" disabled={false}>
					<Icon icon={iconFolderOpen} />
				</Button>
				<Button on:click={() => {
					if (store.theme === "light") {
						store.theme = "dark";
					} else {
						store.theme = "light";
					}
				}} icon="full" type="normal" disabled={false}>
					<Icon icon={use(store.theme, x => x === "light" ? iconDarkMode : iconLightMode)} />
				</Button>
				<Button
					icon="full" type="normal" disabled={false}
					on:click={() => {
						if (this.showLog) {
							this.showLog = false;
						} else {
							this.showLog = true;
						}
					}}>
					<Icon icon={iconTerminal} />
				</Button>
				<Button on:click={async () => {
					try {
						await this.canvas.requestFullscreen({ navigationUI: "hide" });
					} catch { }
				}} icon="full" type="normal" disabled={use(gameState.playing, x => !x)}>
					<Icon icon={iconFullscreen} />
				</Button>
				<Button on:click={() => {
					play();
				}} icon="left" type="primary" disabled={use(this.allowPlay, x => !x)}>
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
	logcontainer: HTMLDivElement,
	showLog: boolean,
}> = function() {
	this.css = `
		width: 100%;
		height: 100%;
		background: var(--bg-sub);
		color: var(--fg);

		display: flex;
		flex-direction: column;
		align-items: center;

		transition: background 200ms, color 200ms;

		.game {
			aspect-ratio: 16 / 9;
			flex: 0 1 min(calc(9 * 100vw / 16), 100vh);
		}

		.logs {
			display: flex;
			flex-direction: column;

			width: 100%;
			height: 25em;
			padding: 0 0.5em 0.5em 0.5em;

			background: var(--bg-sub);
		}

		.resizer {
			background: var(--surface1);
			cursor: ns-resize;
			width: 100%;
			height: 2px;
		}

		.main h2 {
			margin: 0;
		}
	`;

	this.fsOpen = false;
	this.achievementsOpen = false;

	return (
		<div>
			<TopBar
				canvas={use(this.canvas)}
				bind:fsOpen={use(this.fsOpen)}
				bind:achievementsOpen={use(this.achievementsOpen)}
				bind:modInstallerOpen={use(this.modInstallerOpen)}
				bind:showLog={use(this.showLog)}
			/>
			<div class="game">
				<GameView bind:canvas={use(this.canvas)} />
			</div>
			{$if(use(this.showLog), /* @ts-expect-error */
				<>
					<div class="resizer"
						on:mousedown={(e: MouseEvent) => {
							const startY = e.clientY;
							const startHeight = this.logcontainer.clientHeight;
							const onMouseMove = (e: MouseEvent) => {
								this.logcontainer.style.height = `${startHeight + startY - e.clientY}px`;
							}
							const onMouseUp = () => {
								document.removeEventListener("mousemove", onMouseMove);
								document.removeEventListener("mouseup", onMouseUp);
							}
							document.addEventListener("mousemove", onMouseMove);
							document.addEventListener("mouseup", onMouseUp);
						}}></div>
					<div class="logs" bind:this={use(this.logcontainer)}>
						<LogView scrolling={true} />
					</div>
				</>
			)}

			<Dialog name="File System" bind:open={use(this.fsOpen)}>
				<OpfsExplorer open={use(this.fsOpen)} />
			</Dialog>
			<Dialog name="Achievements" bind:open={use(this.achievementsOpen)}>
				<Achievements open={use(this.achievementsOpen)} />
			</Dialog>
			<Dialog name="Mod Installer" bind:open={use(this.modInstallerOpen)}>
				<ModInstaller open={use(this.modInstallerOpen)} />
			</Dialog>
		</div>
	);
}
