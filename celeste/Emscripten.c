#include <emscripten/wasmfs.h>
#include <emscripten/proxying.h>
#include <emscripten/threading.h>
#include <assert.h>
#include <stdio.h>

int mount_opfs() {
	printf("mount_opfs: starting\n");
	backend_t opfs = wasmfs_create_opfs_backend();
	printf("mount_opfs: created opfs backend\n");
	int ret = wasmfs_create_directory("/libsdl", 0777, opfs);
	printf("mount_opfs: mounted opfs\n");
	return ret;
}

int mount_fetch(char *src, char *dst) {
	backend_t fetch = wasmfs_create_fetch_backend(src);
	printf("mount_fetch: created fetch backend for \"%s\"\n", dst);
	int ret = wasmfs_create_file(dst, 0777, fetch);
	printf("mount_fetch: mounted fetch backend for \"%s\"\n", dst);

	return ret;
}

void *SDL_CreateWindow(char *title, int w, int h, uint64_t flags);
void *SDL__CreateWindow(char *title, int w, int h, unsigned int flags) {
	return SDL_CreateWindow(title, w, h, (uint64_t)flags);
}
uint64_t SDL_GetWindowFlags(void *window);
uint32_t SDL__GetWindowFlags(void *window) {
	return (uint32_t)SDL_GetWindowFlags(window);
}

void wasm_func_viil(int x, int y, uint64_t l) {}
