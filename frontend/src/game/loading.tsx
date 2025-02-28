import { LogView } from ".";
import { NAME } from "../main";

// all the units are in vw so that it looks like it's in the game screen

const splashState: Stateful<{
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
			splashState.text = `[${loadedMods}/${totalMods}] Loaded mod ${modName}`;
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
		z-index: 2;
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
			animation: indeterminate 0.75s infinite linear;
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
		--background: rgb(59, 45, 74);

		position: relative;

		background-color: var(--background);
		color: white;

		overflow: hidden;

		.overlay {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			z-index: 1;
		}

		.main {
			display: flex;
			flex-direction: column;

			padding: 1vw;
		}

		.logs {
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
			background-blend-mode: overlay;
			background-size: cover;

			opacity: 0.4;
			z-index: 0;
		}

		.case {
			text-transform: capitalize;
		}

		.large { font-size: min(max(22px, 4vw), 32px); }
		.body { font-size: min(max(14px, 2vw), 20px); }
		.smaller { font-size: min(max(10px, 1.5vw), 16px); }
	`;

	return (
		<div>
			<div class="overlay main">
				<div class="large">
					Loading <span class="case">{NAME}</span>
				</div>
				<div class="smaller logs" bind:this={use(this.logs)}>
					<LogView minimal={true} scrolling={false} />
				</div>
				{$if(use(splashState.text, x => x.length > 0),
					<div class="body modprogress">
						{use(splashState.text)}
					</div>
				)}
			</div>
			<Progress indeterminate={use(splashState.progress, x => x === -1)} progress={use(splashState.progress)} />
			<div class="overlay bg" />
		</div>
	)
}
