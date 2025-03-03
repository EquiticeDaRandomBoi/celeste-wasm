<img src="public/app.ico" width=100 align="left">

<h1>celeste-wasm (threads port)</h1>

<br>

A mostly-complete port of Celeste (2018) to WebAssembly using dotnet 9's threaded WASM support and [FNA WASM libraries](https://github.com/r58playz/FNA-WASM-Build).

This "fork" will be merged into [the original](https://github.com/mercuryWorkshop/celeste-wasm) soon.

## Limitations
- Loading the game consumes 600M or so of memory, which is still around 3x lower than the original port, but it is still too much for low end devices.
- You may encounter issues on firefox.

## I want to build this
1. Ensure node and pnpm exist and `pnpm i`
2. Install dotnet 9.0 (must be 9.0 specifically)
3. Install the mono-devel package on your distro
4. run `sudo dotnet workload restore` in this dir
5. run `make serve` for a dev server and `make build` for a release build

to enable the download/decrypt feature:
1. create a tar archive (optionally gzip compressed) of the Celeste directory

## I want to port this to a newer version of celeste (once it exists)
1. fix any issues with the hooks
2. make a pr!

## I want to figure out how this works
- The native dotnet WASM support is used to compile a decompiled Celeste to WASM
    - `celeste/Program.cs` sets up the Celeste object and exports a function that polls its main loop
    - `celeste/Hooks` uses MonoMod to fix some issues and add features
    - `celeste/Steamworks.cs` polyfills the Steam achievements API for Steam builds of Celeste
- FMOD's WASM builds don't support threads so a wrapper that proxies it to the main thread is built and used instead
    - See `tools/fmod-patch` for more information
- The game canvas is transferred to dotnet's "deputy thread" and all rendering is done from there
