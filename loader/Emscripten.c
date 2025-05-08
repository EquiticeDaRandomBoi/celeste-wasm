#include <emscripten/wasmfs.h>
#include <emscripten/proxying.h>
#include <emscripten/threading.h>
#include <assert.h>
#include <stdio.h>
#include <unistd.h>

int mount_opfs() {
	backend_t opfs = wasmfs_create_opfs_backend();
	int ret = wasmfs_create_directory("/libsdl", 0777, opfs);
	return ret;
}

backend_t fetch_backend = NULL;

int mount_fetch(char *srcdir, char *dstdir) {
	if (!fetch_backend) fetch_backend = wasmfs_create_fetch_backend(srcdir);
	return wasmfs_create_directory(dstdir, 0777, fetch_backend);
}

int mount_fetch_file(char *path) {
	if (!fetch_backend) return -1;

	int ret = wasmfs_create_file(path, 0777, fetch_backend);
	if (ret >= 0)
		return close(ret);
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
