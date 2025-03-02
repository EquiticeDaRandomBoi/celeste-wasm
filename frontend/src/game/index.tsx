import { gameState, loglisteners, preInit, TIMEBUF_SIZE } from "./dotnet";
import { Loader } from "./loading";

export const LogView: Component<{ scrolling: boolean, }> = function() {
	this.css = `
		flex: 1;
		font-family: var(--font-mono);

		.log {
			word-break: break-all;
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
		const logroot = this.root as HTMLElement;
		const frag = document.createDocumentFragment();

		loglisteners.push((x) => frag.append(create(x.color, x.log)));
		setInterval(() => {
			if (frag.children.length > 0) {
				logroot.appendChild(frag);
				logroot.scrollTop = logroot.scrollHeight;
			}
		}, 100);
	};

	return <div style={this.scrolling ? "overflow: scroll" : "overflow: hidden"} />
}

export const GameView: Component<{ canvas: HTMLCanvasElement }, {}> = function() {
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
			# border: 2px solid var(--surface4);
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

export const FpsView: Component<{}, { fps: HTMLElement }> = function() {
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

	return <span>FPS: <span bind:this={use(this.fps)} /></span>
}

export { gameState, play, loadedLibcurlPromise } from "./dotnet";
