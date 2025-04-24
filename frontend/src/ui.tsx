import type { IconifyIcon } from "@iconify/types";

import iconClose from "@ktibow/iconset-material-symbols/close";

export const Button: Component<{
	"on:click": (() => void) | ((e: PointerEvent) => void),

	class?: string,
	type: "primary" | "normal" | "listitem" | "listaction",
	icon: "full" | "left" | "none",
	disabled: boolean,
	title?: string
}, {
	children: any,
}> = function() {
	// @ts-expect-error
	this._leak = true;
	this.css = `
		button {
			display: flex;
			align-items: center;
			justify-content: center;

			width: 100%;
			height: 100%;

			border: none;
			border-radius: 20rem;
			padding: 0.5rem;

			transition: background 0.2s, color 0.2s, transform 0.1s;
			font-family: var(--font-body);
			cursor: pointer;
		}

		button > *, button:active > * {
			transition: transform 0.1s;
			-webkit-user-select: none;
			user-select: none;
			perspective: 800px;
			transform-origin: 50% 0%;
		}

		button:active > * {
			transform: scale(0.975) rotate3d(1, 0, 0, -12.5deg);
			perspective: 1250px;
		}

		button.icon-full svg, button.icon-left svg {
			width: 1.5rem;
			height: 1.5rem;
		}
		button.icon-full {
			border-radius: 4rem;
		}
		button.icon-left {
			gap: 0.25rem;
		}

		button.type-primary {
			background: var(--accent);
			color: var(--fg);
		}
		button.type-normal {
			background: var(--surface1);
			color: var(--fg);
		}
		button.type-listitem {
			background: transparent;
			color: var(--fg);
			border-radius: 0.85rem;
			transition-duration: 0.1s;
			padding-block: 0.75rem;
			padding-inline: 0.5rem;
			&:hover {
				transition-duration: 0.1s;
			}
		}
		button.type-listaction {
			background: var(--surface1);
			color: var(--fg);
		}

		button.type-primary:not(:disabled):hover {
			background: color-mix(in srgb, var(--accent) 80%, white);
		}
		button.type-primary:not(:disabled):active {
			background: color-mix(in srgb, var(--accent) 70%, white);
		}
		button.type-normal:not(:disabled):hover {
			background: var(--surface3);
		}
		button.type-normal:not(:disabled):active {
			background: var(--surface4);
		}
		button.type-listitem:not(:disabled):hover {
			background: var(--surface0);
		}
		button.type-listitem:not(:disabled):active {
			background: var(--surface1);
		}
		button.type-listaction:not(:disabled):hover {
			background: var(--surface2);
		}
		button.type-listaction:not(:disabled):active {
			background: var(--surface3);
		}

		button:disabled {
			background: var(--surface0);
			color: var(--fg4);
			cursor: not-allowed;
		}
	`;
	return (
		<div>
			<button
				on:click={this["on:click"]}
				class={`icon-${this.icon} type-${this.type} ${this.class}`}
				disabled={use(this.disabled)}
				title={use(this.title)}
			>{use(this.children)}</button>
		</div>
	)
}

export const TextField: Component<{
  "on:keydown"?: (() => void) | ((e: KeyboardEvent) => void),
  value: string,
  placeholder?: string,
  class?: string,
  type?: string,
}, {}> = function() {

  this.css = `
    border: 0.125rem solid var(--surface0);
    border-radius: 4rem;
    background: var(--bg-sub);
    padding: 0.5em;
    font-family: var(--font-body);
    padding-left: 0.75rem;
    transition: all 0.1s ease;

    &:hover {
      transition: all 0.1s ease;
      border-color: var(--surface1);
    }

    &:focus {
      transition: all 0.1s ease;
      border-color: var(--accent);
    }

    ::placeholder {
      color: var(--fg6);
    }
  `

  return (
      <input type={this.type || "text"} class={`${this.class}`} placeholder={`${this.placeholder}`} bind:value={use(this.value)} on:keydown={(this["on:keydown"] || (()=>{}))} />
  )
}

export const Icon: Component<{ icon: IconifyIcon, class?: string }, {}> = function() {
	// @ts-expect-error
	this._leak = true;
	this.mount = () => {
		this.root.innerHTML = this.icon.body;
		useChange([this.icon], () => {
			this.root.innerHTML = this.icon.body;
		})
	};
	return (
		<svg
			width="1em"
			height="1em"
			viewBox={use`0 0 ${this.icon.width} ${this.icon.height}`}
			xmlns="http://www.w3.org/2000/svg"
			class={this.class || ""}
		></svg>
	);
}

export const Link: Component<{ href: string }, { children: any[] }> = function() {
	return <a href={this.href} target="_blank">{this.children}</a>
}

export const Dialog: Component<{ name: string, open: boolean }, { children: any[] }> = function() {
	this.css = `
		display: flex;
		flex-direction: column;
		gap: 1.25rem;

		background: var(--bg-sub);
		color: var(--fg);
		border: 1.25px solid var(--surface3);
		border-radius: 1.5rem;

		width: min(40rem, 100%);
		min-height: min(50rem, 100%);
		max-height: min(50rem, 100%);

		position: fixed;
		inset: 0;
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transition: opacity 200ms, visibility 200ms;

		&[open] {
			opacity: 1;
			visibility: visible;
			pointer-events: auto;
		}

		&::backdrop {
			background: var(--bg-sub);
			opacity: 50%;
		}

		.header {
			display: flex;
			gap: 0.5rem;
			align-items: center;
		}

		.header h2 {
			margin: 0;
		}

		.children {
			overflow-y: scroll;
		}

		.expand { flex: 1 }
	`;
	this.mount = () => {
		const root = this.root as HTMLDialogElement;
		useChange([this.open], () => {
			if (this.open) {
				root.showModal();
			} else {
				root.close();
			}
		});
	}
	return (
		<dialog>
			<div class="header">
				<h2>{this.name}</h2>
				<div class="expand" />
				<Button on:click={() => { this.open = false }} type="normal" icon="full" disabled={false} title={"Close"}>
					<Icon icon={iconClose} />
				</Button>
			</div>
			<div class="children">
				{this.children}
			</div>
		</dialog>
	)
}
