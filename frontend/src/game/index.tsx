import { gameState, loglisteners, preInit, TIMEBUF_SIZE } from "./dotnet";
import { Loader } from "./loading";

export const LogView: Component<{ scrolling: boolean, }> = function() {
	this.css = `
		min-height: 0;
		flex: 1;
		font-family: var(--font-mono);

		.log {
			word-break: break-all;
		}

		::-webkit-scrollbar {
			width: 10px;
		}
		::-webkit-scrollbar-track {
			background: var(--surface3);
		}
		::-webkit-scrollbar-thumb {
			background: var(--surface6);
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

	return <div style={this.scrolling ? "overflow: auto" : "overflow: hidden"} />
}

export const GameView: Component<{ canvas: HTMLCanvasElement }, {}> = function () {
  this.css = `
		aspect-ratio: 16 / 9;
		user-select: none;
		position: relative;

		transition: background 150ms, color 150ms;

		.gameoverlay, canvas {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			transition: background 150ms, color 150ms, border-color 150ms;
			border-bottom: 1.75px solid var(--surface2);
		}

		div.started, canvas.stopped {
			visibility: hidden;
			z-index: 0;
		}

		canvas {
			z-index: 1;
		}

		.gameoverlay.notrunning {
			background: var(--surface0);
			color: var(--surface5);
			transition: background 150ms, color 150ms, border-color 150ms;
			font-family: var(--font-display);
			font-size: 2rem;
			font-weight: 570;

			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;

			z-index: 1;
		}

		.gameoverlay.loader {
			opacity: 0;
			visibility: hidden;
			transition: opacity 150ms ease;
			pointer-events: none;
			z-index: 2;
		}

		.gameoverlay.loader.active {
			opacity: 1;
			visibility: visible;
			transition: opacity 150ms ease;
			pointer-events: auto;
		}

		canvas:fullscreen {
			border: none;
			border-radius: 0;
			background: black;
		}
	`;
  const notRunning = use(gameState.playing, x => x ? "gameoverlay notrunning started" : "gameoverlay notrunning stopped");
  const loader = use(gameState.initting, x => x ? "gameoverlay loader active" : "gameoverlay loader");
  const canvas = use(gameState.playing, x => x ? "canvas started" : "canvas stopped");

  this.mount = () => {
    // dotnet will immediately transfer the canvas to deputy thread, so this.mount is required
    preInit();
  };

	return (
		<div>
			{/* {$if(use(gameState.initting), <div class="gameoverlay"><Loader /></div>)} */}
			<div class={loader}>
				<Loader />
			</div>
			<div class={notRunning}>
				Game not running.
			</div>
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
