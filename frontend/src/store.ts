export let store = $store(
	{
		theme: (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark",
		wispServer: import.meta.env.VITE_WISP_URL,
		epoxyVersion: "",
	},
	{ ident: "options", backing: "localstorage", autosave: "auto" }
);
