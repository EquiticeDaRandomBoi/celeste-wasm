import { LogView } from ".";
import { NAME } from "../main";
import { Icon } from "../ui";
import iconSettings from "@ktibow/iconset-material-symbols/settings";

// all the units are in vw so that it looks like it's in the game screen

export const splashState: Stateful<{
	text: string,
	progress: number,
}> = $state({
	text: "",
	progress: -1,
});

export const JsSplash = {
	StartSplash() {
		console.debug("StartSplash...");

		splashState.text = "Starting Everest";
	},
	OnMessage(message: string) {
		let commands: string[] = [];

		if (message.startsWith("#progress")) {
			commands = message.substring(9).split(";");
			const loadedMods = parseInt(commands[0]);
			const totalMods = parseInt(commands[1]);
			const modName = commands[2];

			splashState.progress = loadedMods / totalMods;
			splashState.text = `[${loadedMods}/${totalMods}] Loading mod ${modName}`;
		} else if (message.startsWith("#finish")) {
			commands = message.substring(7).split(";");

			const totalMods = parseInt(commands[0]);
			const msg = commands[1];

			splashState.progress = -1;
			splashState.text = `[${totalMods}/${totalMods}] ${msg}`;
		}
	},
	EndSplash() {
		splashState.progress = -1;
	}
};

const Progress: Component<{ indeterminate: boolean, progress: number }> = function() {
	this.css = `
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: calc(1vw / 2);
		z-index: 22;
		overflow: hidden;

		.value {
			background-color: white;
			height: 100%;
		}

		.value:not(.indeterminate) {
			transition: width 100ms;
			width: var(--percent);
		}

		.value.indeterminate {
			width: 100%;
			transform-origin: 0% 50%;
			animation: indeterminate 1s infinite cubic-bezier(0.2, 0.15, 0.5, 0.95);
		}

		@keyframes indeterminate {
			0% {
				transform: translateX(0) scaleX(0);
			}
			40% {
				transform: translateX(0) scaleX(0.4);
			}
			100% {
				transform: translateX(100%) scaleX(0.5);
			}
		}
	`;

	return (
		<div>
			<div class={use(this.indeterminate, x => x ? "value indeterminate" : "value")} style={use(this.progress, x => `--percent: ${x * 100}%;`)} />
		</div>
	);
}

export const Loader: Component<{}, {
	logs: HTMLElement,
}> = function() {
	this.css = `
		--background: #40262a;

		position: relative;

		width: 100%;
		height: 100%;

		font-family: var(--font-display);
		background-color: var(--background);
		color: white;

		overflow: hidden;

		z-index: 10;

		opacity: 1;
		transition: opacity 625ms ease-out;

		*, * * {
  		opacity: 1;
  		transition: opacity 625ms ease-out;
		}

		@starting-style {
		  opacity: 0;

			*, * * {
				opacity: 0;
			}
		}

		.overlay {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: 22;
		}

		.main {
			display: flex;
			flex-direction: column;

			padding: 1.5vw;
		}

		.logs {
			display: flex;
			flex: 1;
			min-height: 0;
			padding-bottom: 0.5rem;

			mask-image: linear-gradient(to top, rgba(0, 0, 0, 1) 70%, rgba(0, 0, 0, 0.1) 90%, transparent 100%);
		}

		.modprogress {
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}

		.bg {
			background-color: color-mix(in srgb, var(--background), white 1%);
			background-image: url("loader_gradient.png");
			filter: saturate(250%);
			background-blend-mode: overlay;
			background-size: cover;

			opacity: 0.4;
			z-index: 21;
		}

		.gear {
			color: color-mix(in srgb, var(--background), white 35%);
			position: absolute;
			top: 0;
			right: 0;
			width: min(100vw, 1280px);
			height: min(100vw, 1280px);
			transform: translate(50%, -50%);

			animation: spin 12.5s infinite linear;

			filter: blur(8px);

			z-index: 20;
		}

		.case {
			text-transform: capitalize;
		}

		.logs > div {
		  overflow-y: scroll!important;
			scrollbar-width: none;
		}

		.progresswrap {
		  height: min(max(14px, 2vw), 20px);
			margin-block: 0.25rem;
		}

		.large { font-size: min(max(32px, 4.5vw), 48px); }
		.body { font-size: min(max(14px, 2vw), 20px); }
		.smaller { font-size: min(max(10px, 1.5vw), 16px); }

		@keyframes spin {
			100% { transform: translate(50%, -50%) rotate(360deg); }
		}
	`;

	return (
		<div>
			<div class="overlay main">
				<div class="large">
					Loading <span class="case">{NAME}</span>
				</div>
				<div class="smaller logs" bind:this={use(this.logs)}>
					<LogView scrolling={false} />
				</div>
				<div class="progresswrap">
				{$if(use(splashState.text, x => x.length > 0),
					<div class="body modprogress">
						{use(splashState.text)}
					</div>
				)}
				</div>
			</div>
			<Progress indeterminate={use(splashState.progress, x => x === -1)} progress={use(splashState.progress)} />
			<div class="overlay bg" />
			<Icon class="gear" icon={iconSettings} />
		</div>
	)
}
