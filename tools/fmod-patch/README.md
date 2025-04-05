# fmod patches for multithreading
1. download fmod engine html5
2. unzip
3. create `fmod`, `fmodstudio`, `fmod_headers`, `fmodstudio_headers` folders
4. copy headers into their folders
5. dos2unix everything
6. `fish wrap.fish fmod_headers > fmod.c`, same for fmodstudio
7. `emcc -r fmod.c -o fmod/fmod_wrapped.o`
8. `emcc -Ifmod_headers -r fmodstudio.c -o fmodstudio/fmodstudio_wrapped.o`
9. extract contents of fmod_wasm.a and fmodstudio_wasm.a into their folders (they're in w32)
10. `emar rc ../fmod_wrapped.a *.o` in fmod folder, same for fmodstudio
