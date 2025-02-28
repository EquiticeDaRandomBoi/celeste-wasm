import { gameState, play, FpsView, GameView, LogView } from "./game/index";
import { Button, Dialog, Icon, Link } from "./ui";
import { store } from "./store";
import { OpfsExplorer } from "./fs";
import { Achievements } from "./achievements";

import iconPlayArrow from "@ktibow/iconset-material-symbols/play-arrow";
import iconFullscreen from "@ktibow/iconset-material-symbols/fullscreen";
import iconLightMode from "@ktibow/iconset-material-symbols/light-mode";
import iconDarkMode from "@ktibow/iconset-material-symbols/dark-mode";
import iconFolderOpen from "@ktibow/iconset-material-symbols/folder-open";
import iconTrophy from "@ktibow/iconset-material-symbols/trophy";
import iconDownload from "@ktibow/iconset-material-symbols/download";
import { ModInstaller } from "./modinstaller";

export const NAME = "webleste";

export const Logo: Component<{}, {}> = function() {
	this.css = `
		display: flex;
		align-items: center;
		font-size: 1.5rem;

		font-family: var(--font-display);

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
		<div>
			<img src="/app.ico" />
			<span>{NAME}</span>
			<div class="extras">
				<span>v1.4.0.0</span>
			</div>
		</div>
	)
}

const TopBar: Component<{
	canvas: HTMLCanvasElement,
	fsOpen: boolean,
	achievementsOpen: boolean,
	modInstallerOpen: boolean,
}, { allowPlay: boolean, fps: HTMLElement }> = function() {
	this.css = `
		background: var(--bg-sub);
		padding: 1em;
		border-bottom: 2px solid var(--surface1);
		transition: background 200ms, color 200ms, border-color 200ms;
		display: flex;
		align-items: stretch;
		gap: 0.5rem;

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

const BottomBar: Component<{}, {}> = function() {
	this.css = `
		background: var(--bg-sub);
		color: var(--fg3);
		border-top: 2px solid var(--surface1);
		padding: 0.5rem;
		font-size: 0.8rem;
		transition: background 200ms, color 200ms, border-color 200ms;
		display: flex;
		align-items: center;
		justify-content: space-between;

		span {
			text-align: center;
		}

		@media (max-width: 750px) {
			& {
				flex-direction: column;
				gap: 0.5rem;
			}
		}
	`;

	return (
		<div>
			<span>Ported by <Link href="https://github.com/r58playz">r58Playz</Link></span>
			<span>All game assets and code belong to <Link href="https://exok.com/">Extremely OK Games, Ltd.</Link> All rights reserved.</span>
			<span>Check out the project on <Link href="https://github.com/MercuryWorkshop/celeste-wasm/tree/threads-v2">GitHub!</Link></span>
		</div>
	)
}

export const Main: Component<{}, {
	canvas: HTMLCanvasElement,
	fsOpen: boolean,
	achievementsOpen: boolean,
	modInstallerOpen: boolean,
}> = function() {
	this.css = `
		width: 100%;
		height: 100%;
		background: var(--bg);
		color: var(--fg);

		display: flex;
		flex-direction: column;
		overflow: scroll;

		transition: background 200ms, color 200ms;

		.main {
			flex: 1;
			display: flex;
			flex-direction: column;
			padding: 1rem 0;

			margin: auto;
			width: min(1300px, calc(100% - 2rem));
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
			/>
			<div class="main">
				<GameView bind:canvas={use(this.canvas)} />
				<LogView minimal={false} scrolling={true} />
			</div>
			<Dialog name="File System" bind:open={use(this.fsOpen)}>
				<OpfsExplorer open={use(this.fsOpen)} />
			</Dialog>
			<Dialog name="Achievements" bind:open={use(this.achievementsOpen)}>
				<Achievements open={use(this.achievementsOpen)} />
			</Dialog>
			<Dialog name="Mod Installer" bind:open={use(this.modInstallerOpen)}>
				<ModInstaller open={use(this.modInstallerOpen)} />
			</Dialog>
			<BottomBar />
		</div>
	);
}
