export let store = $store(
	{
		logs: false,
		theme: (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark",
		wispServer: import.meta.env.VITE_WISP_URL || "wss://anura.pro",
		epoxyVersion: "",
	},
	{ ident: "options", backing: "localstorage", autosave: "auto" }
);

(self as any).store = store;
