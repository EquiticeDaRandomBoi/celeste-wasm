import iconClose from "@ktibow/iconset-material-symbols/close";
import { Button, Icon } from "./Button";

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
      user-select: none;
      -webkit-user-select: none;
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
