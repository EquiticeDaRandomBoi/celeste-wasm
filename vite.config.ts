import { defineConfig } from 'vite';
import { dreamlandPlugin } from 'vite-plugin-dreamland';
import os from 'node:os'

export default defineConfig({
	plugins: [dreamlandPlugin()],
	root: "./frontend",
	server: {
		headers: {
			"Cross-Origin-Embedder-Policy": "require-corp",
			"Cross-Origin-Opener-Policy": "same-origin",
		},
		strictPort: true,
		// macOS reserves port 5000 for AirPlay Receiver (???)
		port: os.type() === 'Darwin' ? 4999 : 5000,
	},
	build: {
		target: "es2022",
	},
	resolve: {
		alias: {
			fs: "rollup-plugin-node-polyfills/polyfills/empty",
		}
	},
	optimizeDeps: {
		exclude: ["./emsdk"]
	}
});
