import { gameState, play, preInit, TIMEBUF_SIZE } from "./game";
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
			<span>celeste-wasm</span>
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

	this.mount = () => {
		const interval = 250;
		setInterval(() => {
			if (gameState.playing) {
				const avgFrametime = gameState.timebuf.toArray().reduce((acc, x) => acc + x, 0) / TIMEBUF_SIZE;
				const avgFps = (1000 / avgFrametime).toFixed(0);
				this.fps.innerText = "" + avgFps;
			}
		}, interval);
	}

	return (
		<div>
			<div class="group">
				<Logo />
				{$if(use(gameState.playing), <div>FPS: <span bind:this={use(this.fps)}></span></div>)}
			</div>
			<div class="expand" />
			<div class="group">
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
const Loader: Component<{}, {
	spinnerstate: string
}> = function() {
	this.css = `
		width: 100%;
		height: 100%;
		overflow: hidden;
		position: relative;
		.fix {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
		}

		.text {
			position: absolute;
			top: 0;
			display: flex;
			width: 100%;
			padding-top: 3rem;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			gap: 0.5em;
		}

		h2 {
			font-size: 3rem;
			font-family: var(--font-display);
			text-shadow: 0 0 1rem var(--fg6);
			color: white;
			padding: 0;
			margin: 0;
		}
		h3 {
			font-size: 2rem;
			font-family: var(--font-display);
			color: var(--fg6);

			padding: 0;
			margin: 0;
		}
		.spinner {
			position: absolute;
			bottom: 0em;
			right: 0em;
			width: 2em;
			height: 2em;
			transform: translate(-50%, -50%);
			transition: opacity 200ms;
		}
	`
	this.mount = () => {
		let particles = [];
		for (let i = 0; i < 100; i++) {
			let randclamp = (min: number, max: number) => Math.min(Math.max(min, Math.random() * (max - min)), max);
			particles.push({
				x: randclamp(0, 100),
				y: randclamp(0, 100),
				size: Math.random() < 0.1 ? randclamp(3, 5) : randclamp(0.1, 2),
				speed: randclamp(0.1, 1),
				offset: randclamp(Math.PI / 4, Math.PI / 2),
				elm: <img class="snowflake" src="snow.png" style="position: absolute; top: 0; left: 0; width: 1rem; height: 1rem;" />
			});
			this.root.appendChild(particles[i].elm);
		}

		let upd = () => {
			for (let particle of particles) {
				let y = Math.sin(performance.now() / 1000 * particle.speed + particle.offset) * 10 + particle.y;
				particle.x -= particle.speed;
				if (particle.x <= 0)
					particle.x = 100;
				if (y >= 100)
					y -= 100;
				if (y <= 0)
					y += 100;

				particle.elm.style.opacity = String(1 - (particle.size) / 4);
				particle.elm.style.transform = `translate(${particle.x}rem, ${y}rem) scale(${particle.size})`;
			}
			requestAnimationFrame(upd);
		};
		upd();

		let i = 0;
		setInterval(() => {
			i++;
			this.spinnerstate = `loading/0${i % 10}.png`;
		}, 100);
	};

	return <div>
		<div class="fix" style={{ filter: "brightness(0.18)", backgroundImage: "url(/overlay.png)", backgroundRepeat: "repeat-x", backgroundSize: "80% 100%" }} />
		<img class="fix" src="vignette.png" style="opacity: 0.1" />
		<div class="text">
			<h2>celeste-wasm</h2>
			<h3>Loading...</h3>
		</div>
		<img class="spinner" src={use(this.spinnerstate)} />
	</div>
}

const GameView: Component<{ canvas: HTMLCanvasElement }, {}> = function() {
	this.css = `
		aspect-ratio: 16 / 9;
		user-select: none;
		display: grid;
		grid-template-areas: "overlay";

		transition: background 200ms, color 200ms;

		div, canvas {
			grid-area: overlay;
			width: 100%;
			height: 100%;
			border: 2px solid var(--surface4);
			transition: background 200ms, color 200ms, border-color 200ms;
		}
		div.started, canvas.stopped {
			visibility: hidden;
		}

		div {
			background: var(--surface1);
			color: var(--surface6);
			transition: background 200ms, color 200ms, border-color 200ms;
			font-family: var(--font-display);
			font-size: 2rem;
			font-weight: 570;
			
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
		}

		canvas:fullscreen {
			border: none;
			border-radius: 0;
			background: black;
		}
	`;
	const div = use(gameState.playing, x => x ? "started" : "stopped");
	const canvas = use(gameState.playing, x => x ? "canvas started" : "canvas stopped");

	this.mount = () => {
		// dotnet will immediately transfer the canvas to deputy thread, so this.mount is required
		preInit();
	};

	return (
		<div>
			<div class={div}>
				Game not running.
			</div>
			{$if(use(gameState.initting), <Loader />)}
			<canvas
				id="canvas"
				class={canvas}
				bind:this={use(this.canvas)}
				on:contextmenu={(e: Event) => e.preventDefault()}
			/>
		</div>
	)
}

const LogView: Component<{}, {}> = function() {
	this.css = `
		height: 16rem;
		overflow: scroll;
		padding: 1em;

		border: 2px solid var(--surface4);
		border-top: none;
		background: var(--bg-sub);
		transition: background 200ms, color 200ms, border-color 200ms;
		font-family: var(--font-mono);

		.log {
			transition: color 200ms;
		}
	`;

	const create = (color: string, log: string) => {
		const el = document.createElement("div");
		el.classList.add("log");
		el.innerText = log;
		el.style.color = color;
		return el;
	}

	this.mount = () => {
		setInterval(() => {
			if (gameState.logbuf.length > 0) {
				for (const log of gameState.logbuf) {
					this.root.appendChild(create(log.color, log.log));
				}
				this.root.scrollTop = this.root.scrollHeight;
				gameState.logbuf = [];
			}
		}, 1000);
	};

	return (
		<div>
		</div>
	)
}

export const Main: Component<{}, {
	canvas: HTMLCanvasElement,
	fsOpen: boolean,
	achievementsOpen: boolean,
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
			/>
			<div class="main">
				<GameView bind:canvas={use(this.canvas)} />
				<LogView />
			</div>
			<Dialog name="File System" bind:open={use(this.fsOpen)}>
				<OpfsExplorer open={use(this.fsOpen)} />
			</Dialog>
			<Dialog name="Achievements" bind:open={use(this.achievementsOpen)}>
				<Achievements open={use(this.achievementsOpen)} />
			</Dialog>
			<BottomBar />
		</div>
	);
}
