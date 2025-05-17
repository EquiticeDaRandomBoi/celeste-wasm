STATICS_RELEASE=866eb1ea-276c-48ce-8413-f6a048fbf3e8
DOTNETFLAGS=--nodereuse:false -v d

statics:
	mkdir statics
	wget https://github.com/r58Playz/FNA-WASM-Build/releases/download/$(STATICS_RELEASE)/FAudio.a -O statics/FAudio.a
	wget https://github.com/r58Playz/FNA-WASM-Build/releases/download/$(STATICS_RELEASE)/FNA3D.a -O statics/FNA3D.a
	wget https://github.com/r58Playz/FNA-WASM-Build/releases/download/$(STATICS_RELEASE)/libmojoshader.a -O statics/libmojoshader.a
	wget https://github.com/r58Playz/FNA-WASM-Build/releases/download/$(STATICS_RELEASE)/SDL3.a -O statics/SDL3.a
	wget https://github.com/r58Playz/FNA-WASM-Build/releases/download/$(STATICS_RELEASE)/liba.o -O statics/liba.o
	wget https://github.com/r58Playz/FNA-WASM-Build/releases/download/$(STATICS_RELEASE)/hot_reload_detour.o -O statics/hot_reload_detour.o
	wget https://github.com/r58Playz/FNA-WASM-Build/releases/download/$(STATICS_RELEASE)/dotnet.zip -O statics/dotnet.zip
	wget https://github.com/r58Playz/FNA-WASM-Build/releases/download/$(STATICS_RELEASE)/libcrypto.a -O statics/libcrypto.a

SteamKit2.WASM:
	git clone https://github.com/MercuryWorkshop/SteamKit2.WASM --recursive

FNA:
	git clone https://github.com/FNA-XNA/FNA --recursive -b 25.02
	cd FNA && git apply ../FNA.patch

NLua:
	git clone https://github.com/NLua/NLua --recursive
	cd NLua && git checkout 9dc76edd0782d484c54433fdfa3a5097f45a379a && git apply ../nlua.patch

MonoMod:
	git clone https://github.com/r58Playz/MonoMod --recursive

emsdk:
	git clone https://github.com/emscripten-core/emsdk
	./emsdk/emsdk install 3.1.56
	./emsdk/emsdk activate 3.1.56
	python3 ./sanitizeemsdk.py "$(shell realpath ./emsdk/)"
	patch -p1 --directory emsdk/upstream/emscripten/ < emsdk.patch
	rm -rvf emsdk/upstream/emscripten/cache/*

dotnetclean:
	rm -rvf {loader,patcher,corefier,Steamworks}/{bin,obj} frontend/public/_framework nuget || true
clean: dotnetclean
	rm -rvf statics MonoMod NLua FNA SteamKit2.WASM emsdk || true

deps: statics FNA MonoMod NLua SteamKit2.WASM emsdk

build: deps
	pnpm i
	rm -r frontend/public/_framework loader/bin/Release/net9.0/publish/wwwroot/_framework || true
#
	NUGET_PACKAGES="$(shell realpath .)/nuget" dotnet restore loader $(DOTNETFLAGS)
	bash replaceruntime.sh
	NUGET_PACKAGES="$(shell realpath .)/nuget" dotnet publish loader -c Release $(DOTNETFLAGS)
#
	cp -r loader/bin/Release/net9.0/publish/wwwroot/_framework frontend/public/
	# emscripten sucks
	sed -i 's/var offscreenCanvases \?= \?{};/var offscreenCanvases={};if(globalThis.window\&\&!window.TRANSFERRED_CANVAS){transferredCanvasNames=[".canvas"];window.TRANSFERRED_CANVAS=true;}/' frontend/public/_framework/dotnet.native.*.js
	# dotnet messed up
	sed -i 's/this.appendULeb(32768)/this.appendULeb(65535)/' frontend/public/_framework/dotnet.runtime.*.js
	# fmod messed up
	sed -i 's/return runEmAsmFunction(code, sigPtr, argbuf);/return runMainThreadEmAsm(code, sigPtr, argbuf, 1);/' frontend/public/_framework/dotnet.native.*.js

serve: build
	pnpm dev

publish: build
	pnpm build


.PHONY: clean build serve publish
