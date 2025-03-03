import { gameState, LogView } from "./game";
import { initSteam } from "./game/dotnet";
import { Button, Icon } from "./ui";

import iconEncrypted from "@ktibow/iconset-material-symbols/encrypted";

export const steamState: Stateful<{
	login: number,
	qr: string,
}> = $state({
	login: 0,
	qr: ""
});

export const SteamCloud: Component<{
	open: boolean
}> = function() {
	this.css = `
		height: 100%;
	`;

	return (
		<div>
			{$if(use(steamState.login, l => l == 2),
				<div>
					<p>Logged Into Steam</p>
				</div>,
				<div>
					<SteamLogin />
				</div>
			)}
		</div>
	)
}



export const SteamLogin: Component<{}, {
	username: string,
	password: string,
}> = function() {
	this.css = `
		display: flex;
		flex-direction: column;
		gap: 1rem;
		font-size: 15pt;

		input[type="file"] {
			display: none;
		}

		.methods {
		  display: flex;
		  gap: 1rem;
		}
		.methods > div {
		  flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      padding: 1rem;
		}
		input {
		  color: var(--fg);
		  background: var(--bg);
		  border: 2px solid black;
		  border-radius: 0.5em;
		  padding: 0.25rem;

		  font-family: Andy Bold;
		  font-size: 18pt;
		}

		.spacer {
		      flex: 1;
		      margin-top: 0.5em;
		      margin-bottom: 0.5em;
		      border-bottom: 1px solid var(--fg);
    }

		h1, h3 {
		  text-align: center;
		  font-family: Andy Bold;
      padding: 0;
      margin: 0;
		}
		.logcontainer {
		  font-size: initial;
		  max-height: 5em;
		  display: flex;
		}

		.qrcontainer {
		  display: flex;
      justify-content: center;
      flex-direction: column;
      align-items: center;
      width: 100%;
		}
		.qrcontainer img {
		  width: 40%;
		}
  `
	this.username = "";
	this.password = "";

	const loginqr = async () => {
		steamState.login = 1;
		let result = await initSteam(null, null, true);
		if (!result) {
			steamState.login = 3;
		} else {
			steamState.login = 2;
		}

	};

	const loginpass = async () => {
		steamState.login = 1;
		let result = await initSteam(this.username, this.password, false);
		if (!result) {
			this.username = "";
			this.password = "";
			steamState.login = 3;
		} else {
			steamState.login = 2;
		}
	};

	return <div>
		<h1>Steam Login</h1>
		<div>
			This will log into Steam through a proxy, so that it can download Terraria assets and achievement stats <br />
			The account details are encrpyted on your device and never sent to a server. Still, beware of unofficial deployments
		</div>

		{$if(use(steamState.login, l => l == 0 || l == 3),
			<div class="methods">
				<div class="tcontainer">
					<h3>Username and Password</h3>
					<input bind:value={use(this.username)} placeholder="Username" />
					<input bind:value={use(this.password)} type="password" placeholder="Password" />
					<Button type="primary" icon="left" disabled={use(gameState.ready, r => !r)} on:click={loginpass}>
						<Icon icon={iconEncrypted} />
						Log In with Username and Password
					</Button>
				</div>
				<div class="tcontainer">
					<h3>Steam Guard QR Code</h3>
					Requires the Steam app on your phone to be installed. <br />
					<div style="flex: 1"></div>
					<Button type="primary" icon="left" disabled={use(gameState.ready, r => !r)} on:click={loginqr}>
						<Icon icon={iconEncrypted} />
						Log In with QR Code
					</Button>
				</div>
			</div>
		)}

		{$if(use(steamState.login, l => l == 3),
			<div style="color: var(--error)">Failed to log in! Try again</div>
		)}

		{$if(use(steamState.login, l => l == 3 || l == 1 || l == 2),
			<div class="logcontainer">
				<LogView scrolling={true} />
			</div>
		)}

		{$if(use(steamState.login, l => l == 1),
			<div class="qrcontainer">
				<p>Since this uses a proxy, the steam app might complain about your location being wrong. Just select the location that you don't usually log in from if it asks</p>
				{$if(use(steamState.qr),
					<img src={use(steamState.qr)} />
				)}

				{$if(use(steamState.qr),
					<div>Scan this QR code with the Steam app on your phone.</div>
				)}

			</div>
		)}
	</div>
}


