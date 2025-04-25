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
	const transition = "background 0.15s, color 0.15s, transform 0.15s, border-color 0.15s, border 0.15s, border-bottom 0.15s"
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
			font-family: var(--font-body);
			cursor: pointer;
		}

		button,button:hover,button:focus,button:active,button:disabled {
		  transition: ${transition};
		}

		button:not(:disabled, .type-listitem) {
		  --border-color: color-mix(in srgb, var(--fg) 10.5%, transparent);
		  box-shadow: inset 0px -0.85px 1px 0px var(--border-color);
		}

		button, button:active {
			transition: transform 0.1s;
			-webkit-user-select: none;
			user-select: none;
			perspective: 800px;
			transform-origin: 50% 100%;
			perspective: 1250px;
		}

		button:not(.type-listitem) {
			padding-bottom: 0.5rem;
		}

		button:not(:disabled):hover {
  		transform: rotate3d(1, 0, 0, 7.5deg);
  	}

		button:not(:disabled):active {
			transform: rotate3d(1, 0, 0, 17.5deg);
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
			--border-color: color-mix(in srgb, var(--accent) 55%, var(--fg));
	    transition: ${transition};
		}
		button.type-normal {
			background: var(--surface1);
			color: var(--fg);
      transition: ${transition};
		}
		button.type-listitem {
			background: transparent;
			color: var(--fg);
			border-radius: 0.85rem;
			transition-duration: 0.1s;
			padding-block: 0.75rem;
			padding-inline: 0.5rem;
			border: none;
      transition: ${transition};
			&:hover {
				transition-duration: 0.1s;
			}
		}
		button.type-listaction {
			background: var(--surface1);
			color: var(--fg);
      transition: ${transition};
		}

		button.type-primary:not(:disabled):hover {
			background: color-mix(in srgb, var(--accent) 80%, white);
      transition: ${transition};
		}
		button.type-primary:not(:disabled):active {
			background: color-mix(in srgb, var(--accent) 70%, white);
      transition: ${transition};
		}
		button.type-normal:not(:disabled):hover {
			background: var(--surface3);
			border-color: color-mix(in srgb, var(--surface4) 60%, var(--surface3));
      transition: ${transition};
		}
		button.type-normal:not(:disabled):active {
			background: var(--surface4);
			border-color: color-mix(in srgb, var(--surface5) 80%, var(--surface4));
      transition: ${transition};
		}
		button.type-listitem:not(:disabled):hover {
			background: var(--surface0);
      transition: ${transition};
		}
		button.type-listitem:not(:disabled):active {
			background: var(--surface1);
      transition: ${transition};
		}
		button.type-listaction:not(:disabled):hover {
			background: var(--surface2);
			border-color: color-mix(in srgb, var(--surface3) 80%, var(--surface2));
      transition: ${transition};
		}
		button.type-listaction:not(:disabled):active {
			background: var(--surface3);
			border-color: color-mix(in srgb, var(--surface4) 80%, var(--surface3));
      transition: ${transition};
		}

		button:disabled {
			background: var(--surface0);
			color: var(--surface6);
			cursor: not-allowed;
			border-color: transparent;
      transition: ${transition};
			// border-color: color-mix(in srgb, var(--surface0) 98%, var(--fg));
		}
	`;
	return (
		<div class="component-btn">
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
    border: 0.1rem solid var(--surface0);
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
      color: var(--surface6);
    }
  `

  return (
      <input type={this.type || "text"} class={`component-textfield ${this.class}`} placeholder={`${this.placeholder}`} bind:value={use(this.value)} on:keydown={(this["on:keydown"] || (()=>{}))} />
  )
}

export const Switch: Component<{
  "on:change"?: (() => void) |((e: InputEvent) => void),
  on: boolean,
  title: string,
  disabled?: boolean,
  class?: string,
}, {}> = function() {
  // @ts-expect-error
  this._leak = true;
  const transition = "background 0.2s, transform 0.2s, width 0.2s";

  this.css = `
    align-items: center;
    display: flex;
    justify-content: space-between;

    user-select: none;
    -webkit-user-select: none;

    .switch-container {
      position: relative;
      display: inline-block;
      width: 3.2rem;
      height: 1.8rem;
      flex: 0 0 auto;
      max-width: 3.2rem;
    }

    .switch-container input {
      opacity: 0;
      width: 0;
      height: 0;
      margin: 0;
    }

    .switch-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--surface3);
      transition: ${transition};
      border-radius: 2rem;
      box-shadow: inset 0px 0px 5px -0.1px color-mix(in srgb, var(--fg) 10%, transparent), inset 0px -0.7px 1px 0px color-mix(in srgb, var(--fg) 17.5%, transparent);
    }

    .switch-slider:before {
      position: absolute;
      content: "";
      height: 1.4rem;
      width: 1.4rem;
      left: 0.2rem;
      bottom: 0.2rem;
      background-color: white;
      transition: ${transition};
      border-radius: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    input:checked + .switch-slider {
      background-color: var(--accent);
    }

    input:active + .switch-slider {
      background-color: var(--surface5);
    }

    .switch-container:hover input:checked:not(:disabled) + .switch-slider {
      background-color: color-mix(in srgb, var(--accent) 87.5%, var(--fg));
    }

    input:checked:active + .switch-slider {
      background-color: color-mix(in srgb, var(--accent) 70%, var(--fg));
    }

    .switch-container:hover input:not(:checked):not(:disabled) + .switch-slider {
      background-color: var(--surface4);
    }

    input:active + .switch-slider:before {
      width: 1.7rem;
      transition: ${transition}
    }

    input:checked:active + .switch-slider:before {
      transform: translateX(1.1rem);
    }

    input:disabled + .switch-slider {
      background-color: var(--surface0);
      cursor: not-allowed;
    }

    input:checked:disabled + .switch-slider {
      background-color: color-mix(in srgb, var(--accent) 50%, var(--surface3));
    }

    input:checked + .switch-slider:before {
      transform: translateX(1.4rem);
    }
  `;

  return (
    <div class="component-switch">
      <span class="switch-label">{use(this.title)}</span>
      <label class={`switch-container component-switch ${this.class || ''}`}>
        <input
          type="checkbox"
          checked={use(this.on)}
          disabled={use(this.disabled || false)}
          on:change={(this["on:change"]||(()=>{}))}
        />
        <span class="switch-slider"></span>
      </label>
    </div>
  );
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
      class={`component-icon ${this.class}`}
		></svg>
	);
}

export const Link: Component<{ href: string }, { children: any[] }> = function() {
	return <a href={this.href} class="component-link" target="_blank">{this.children}</a>
}

export const Dialog: Component<{ name: string, open: boolean }, { children: any[] }> = function() {
	this.css = `
		display: flex;
		flex-direction: column;
		gap: 0.8rem;

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
			background: rgba(32, 28, 28, 0.35);
		}

		.header {
			display: flex;
			gap: 0.5rem;
			align-items: center;
      border-bottom: 1.8px solid var(--surface2);
      padding-bottom: 0.5rem;
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
		<dialog class="component-dialog">
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
