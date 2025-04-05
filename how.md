# Porting Terraria and Celeste to WebAssembly

I've always been interested in weird things running in the browser, so when I saw an old post of someone running a half working copy of the game Celeste in the browser, I knew I had to try and recreate it myself.

Both Celeste and Terraria were written using XNA, a proprietary low level C# game "engine" developed and subsequently abandoned by Microsoft. It was eventually replaced with the community maintained FNA library, including a SDL backend and greater platform support.

Like Java, C# compiles to a platform-independent bytecode format. Common Intermediate Language (referred to as MSIL or just IL) was designed to map very closely to the original code. The game binaries are typically provided with symbols for both function names and local variables, so the output from the decompiler is typically about as close to the original source as possible.

Starting with .NET 5, Microsoft released Blazor in an attempt to take over the frontend world with C#'s "Enterprise Reliability", and with it came the ability to run any C# in WebAssembly

thanks r58 for figuring most of this stuff out and bomberfish for making a cool ui

# Terraria

Without knowing much about C# in general we figured a good place to start was setting up a development environment for modding. In theory, all we needed to do was decompile the game, change the target to webassembly, and then recompile it.

## Setting up a project

Running `ilspycmd` on Terraria.exe, decompilation *failed* because of a missing `ReLogic.dll`. It turned out that the library was actually embedded into the game itself as a resource.

That's.. odd, but we can extract it from the binary pretty easily. Easiest way is just to create a new c# project and dynamically load in the assembly..

```cs
Assembly assembly = Assembly.LoadFile("Terraria.exe");
```
And then since all the terraria code is loaded, we can just extract it the same way the game does!
```cs
Stream? stream = assembly.GetManifestResourceStream("Terraria.Libraries.NET.ReLogic.dll");
FileStream outstream = File.OpenWrite("ReLogic.dll");
stream.CopyTo(outstream);
```

After putting `ReLogic.dll` into the library path, decompilation succeeded, and after installing all the dependencies Terraria uses, the project recompiles and launches on linux.

Now that we knew the decompilation was good, I created a project file for the new code targetting WASM and configuring emscripten.

```xml
<Project Sdk="Microsoft.NET.Sdk.WebAssembly">
<PropertyGroup>
		<StartupObject>Program</StartupObject>
		<EmccExtraLDFlags>-sMIN_WEBGL_VERSION=2 -sWASMFS</EmccExtraLDFlags>
		<EmccEnvironment>web,worker</EmccEnvironment>
</PropertyGroup>
<ItemGroup>
		<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
		<PackageReference Include="Newtonsoft.Json.Bson" Version="1.0.3" />
		<PackageReference Include="DotNetZip" Version="1.16.0" />
		<PackageReference Include="MP3Sharp" Version="1.0.5" />
		<PackageReference Include="NVorbis" Version="0.10.5" />
</ItemGroup>
</Project>
```

Somewhat surprisingly, all of the project code compiles without issue, but the FNA engine is partially written in c++ and needs to be linked against its native components. The web target isn't officially supported by FNA, but its native components compile without issue under emscripten's opengl emulation layer. This process is automated by [FNA-WASM-BUILD](https://github.com/r58Playz/FNA-WASM-Build).

The archive files from the build system can be added with `<NativeFileReference>` and then will automatically get linked together with the rest of the runtime during emscripten compilation.

```xml
<!-- FNA -->
<NativeFileReference Include="SDL3.a" />
<NativeFileReference Include="FNA3D.a" />
<NativeFileReference Include="libmojoshader.a" />
<NativeFileReference Include="FAudio.a" />
```

Now, it fully builds and generates web output, and we can try and get the game running.

## Running the game
Everything now compiles, but for the game to actually launch we have to get the game assets into the environment. Since everything goes through emscripten's filesystem emulation, this part is pretty easy, since it uses the browser's [Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) for the site, and we can simply ask the user to select their game directory with `window.showDirectoryPicker()`, then mount it in the emscripten filesystem.

image here

After a [quick patch to FNA](https://github.com/MercuryWorkshop/terraria-wasm/blob/master/FNA.patch) to resolve a generics issue, the game launched.

image of relogic logo

After trying to enter a world though, the game immediately crashes after trying to create a new thread, which was not supported in .NET 8.0 wasm.

We knew that they would be supported in the next version, so we waited about a month for NET 9.0 to get a stable release before continuing. Once it was packaged, we added the `<WasmEnableThreads>true</WasmEnableThreads>` option to the project and recompiled.

This time though, FNA failed to initialize.

It turns out that in NET threaded mode, *all* code runs inside web workers, not just the secondary threads. What would usually be called the "main" thread is actually running on `dotnet-worker-001`, referred to as the "deputy thread".

This is an issue since FNA is solely in the worker, and the `<canvas>` can only be accessed on the DOM thread. This is solved by the browser's `OffscreenCanvas` API, but we were still working with SDL2, which didn't support it, and FNA didn't work with SDL3 at the time we wrote this.

## FNA Proxy
If we couldn't run the game on the main thread, and we couldn't transfer the canvas over to the worker, the only option left was to proxy the OpenGL calls to the main thread.

We wrote a [fish script](https://github.com/r58Playz/FNA-WASM-Build/blob/b05cbc703753c917499bf955091f62c3b845ba8f/wrap_fna.fish) that would automatically parse every single method from FNA3D's exported symbols (FNA's native C component), and automatically compile and export a wrapper method method that would use `emscripten_proxy_sync` to proxy the call from `dotnet-worker-001` to the DOM thread.

Let's look at the native method `FNA3D_Device* FNA3D_CreateDevice(FNA3D_PresentationParameters *presentationParameters,uint8_t debugMode);`, the first one that gets called in any program

The script automatically generates a C file containing the wrapper method, `WRAP_FNA3D_CreateDevice`

```c
typedef struct {
	FNA3D_PresentationParameters *presentationParameters;
	uint8_t debugMode;
	FNA3D_Device* *WRAP_RET;
} WRAP__struct_FNA3D_CreateDevice;
void WRAP__MAIN__FNA3D_CreateDevice(void *wrap_struct_ptr) {
	WRAP__struct_FNA3D_CreateDevice *wrap_struct = (WRAP__struct_FNA3D_CreateDevice*)wrap_struct_ptr;
	*(wrap_struct->WRAP_RET) = FNA3D_CreateDevice(
		wrap_struct->presentationParameters,
		wrap_struct->debugMode
	);
}
FNA3D_Device* WRAP_FNA3D_CreateDevice(FNA3D_PresentationParameters *presentationParameters,uint8_t debugMode)
{
	// $func: `FNA3D_Device* FNA3D_CreateDevice(FNA3D_PresentationParameters *presentationParameters,uint8_t debugMode)`
	// $ret: `FNA3D_Device*`
	// $name: `FNA3D_CreateDevice`
	// $args: `FNA3D_PresentationParameters *presentationParameters,uint8_t debugMode`
	// $argsargs: `presentationParameters,debugMode`
	// $argc: `2`
	//
	// return FNA3D_CreateDevice(presentationParameters,debugMode);
	FNA3D_Device* wrap_ret;
	WRAP__struct_FNA3D_CreateDevice wrap_struct = {
		.presentationParameters = presentationParameters,
		.debugMode = debugMode,
		.WRAP_RET = &wrap_ret
	};
	if (!emscripten_proxy_sync(emscripten_proxy_get_system_queue(), emscripten_main_runtime_thread_id(), WRAP__MAIN__FNA3D_CreateDevice, (void*)&wrap_struct)) {
		emscripten_run_script("console.error('wrap.fish: failed to proxy FNA3D_CreateDevice')");
		assert(0);
	}
	return wrap_ret;
}
```
And the wrapper is compiled in with the rest of FNA3D.

Then in the FNA C# code, where the native C is linked to, we replace the PInvoke binding:

```csharp
[DllImport(FNA3D, EntryPoint = "FNA3D_CreateDevice", CallingConvention = CallingConvention.Cdecl)]`
public static extern IntPtr FNA3D_CreateDevice(...);
```
...With one that calls our wrapper instead
```csharp
[DllImport(FNA3D, EntryPoint = "WRAP_FNA3D_CreateDevice", CallingConvention = CallingConvention.Cdecl)]`
public static extern IntPtr FNA3D_CreateDevice(...);
```
Ensuring that all the native calls to SDL went through the DOM thread instead of C#'s "main" deputy thread.

Okay. That was a lot. Does it work?

uh.. okay. sure. i guess i'll just implement crypto myself.

Now does it work?

# celeste


at first we just committed the entire source code into a private repository

# celeste
We also wanted to get Celeste working, since the person who shared the initial snippet had never released their work publicly. We thought that we could get it running, and maybe also get the Everest mod loader running with the game.


Celeste is also written in FNA, so we went through more or less the same process that we took to get Terraria compiled.

At this point, the SDL3 tooling was stable enough for us to upgrade, giving us access to `OffscreenCanvas`, so we would no longer need the proxy hack. Naturally, we still needed to [patch emscripten](https://github.com/MercuryWorkshop/celeste-wasm/blob/threads-v2/Makefile#L52) to work around some bugs. nothing is ever without jank :)

We had another dependency issue though: Celeste uses the proprietary [FMOD](https://www.fmod.com) library for game audio instead of FAudio like Terraria.

FMOD *does* provide emscripten builds, distributed as archive files, but as luck would have it- it also didn't like being run in a worker. We could use the wrap script again, but it isn't open source, so we couldn't just recompile it like we did for FNA. But, since we weren't modifying the native code itself, we could just extract the `.o` files from the FMOD build, and insert the codegenned c compiled as an object.

After a couple of patches that aren't worth mentioning here:

image

And now we have a proper system for applying patches too, monomod.patcher (move section here?)

Okay cool. Now Everest. I wanna play the [strawberry jam](https://gamebanana.com/mods/424541) mod on my chromebook.

A mod loader is generally built around two components, a patched version of the game that provides an api, and a method of loading code at runtime and modifying behavior

Both are provided by MonoMod, an instrumentation framework for c# specifically built for game modding. 

the patcher part modifies the game on disk, so no problem there. but the runtime modifications use a module called `RuntimeDetour`, which is very not supported on WebAssembly.

I'll explain how we ported it to NET's WASM SDK, but first it will help to take a little detour (haha) into the history of .NET Core

# netcore

The .NET platform used to be windows only and very closed source, along with a number of other limitations. Microsoft took so long to fix these that the [Mono Project]() was created to reimplement the .NET runtime.

Microsoft [bought out Xamarin](https://blogs.microsoft.com/blog/2016/02/24/microsoft-to-acquire-xamarin-and-empower-more-developers-to-build-apps-on-any-device/) in 2016 and accquired Mono. A new runtime backend (CoreCLR) was merged with Mono's platform support and AOT tooling to create the horrifying amalgamation that became known as .NET Core.

This left the original mono project to fall behind, and eventually was left up to the wine project to maintain, leaving it as yet another example of Microsoft's [Embrace, Extend, Extingish](https://en.wikipedia.org/wiki/Embrace,_extend,_and_extinguish) strategy.

What does this mean for us? Microsoft's browser NET runtime is actually just regular Mono compiled to emscripten, with bits of .NET Core merged in. Outside of the browser though, Mono isn't used at all, since code runs on the new CoreCLR runtime.

# MonoMod.RuntimeDetour
Everest mods use this

Internally, it's powered by function detouring, a common tool for game modding/cheating. Typically though, it's associated with unmanaged languages like c/c++. It works a little differently in a language like c#.

Oversimplifying a little, the process MonoMod uses to hook into functions on desktop is:

- Copy the original method's IL bytecode into a new controlled method with modifications  
- Call MethodBase.GetFunctionPointer() or "thunk" the runtime to retrieve pointers to the executable regions in memory that the jit code is held in  
- Ask the OS kernel to disable write protection on the pages of memory where the jitted code is  
- [Write the bytes for a long jmp](https://github.com/MonoMod/MonoMod/blob/reorganize/src/MonoMod.Core/Platforms/Architectures/x86_64Arch.cs#L266  ) (`0xFF 0x25 + pointer`) into the start of the function to redirect the control flow back into MonoMod.  
- Force the JIT code for the new modified method to generate and move the control flow there.

This works because on desktop, all functions run through the CoreCLR JIT before they're executed, so all functions are guaranteed to have corresponding native code regions before they're even executed.

However, Mono WASM does not work this way. It runs in mostly interpreted mode with a limited “jit-traces” engine called the "jiterpreter", meaning not every method will have corresponding native code.

And even if it did - WebAssembly modules are *read only*, you can add new code at runtime, but you can't just hot patch existing code to mess with the internal state. WebAssembly is AOT compiled to native code on module instantiation, so it would be infeasible to allow runtime modification while keeping internal guarantees.

So instead of creating a detour by modifying raw assembly, what if we just disabled the jiterpreter and modified the IL bytecode? Since it's all interpreted on the fly, we should just be able to mess with the instructions loaded into memory.

To check the feasibility, I ran a simple test: run `MethodBase.GetILAsByteArray()`, then brute force search for those bytes in the webassembly memory and replace them with a bytecode NOP (`0x00 0x2A`)

image

Now if we could just find the bytecode pointer programmatically...

There was the address from `MethodBase.GetFunctionPointer()`, but it wasn't anywhere near the code, and it definitely wasn't a native code region like on desktop. Eventually we realized that it was a pointer to the mono runtime's [internal `InterpMethod` struct](https://github.com/dotnet/runtime/blob/a2e1d21bb4faf914363968b812c990329ba92d8e/src/mono/mono/mini/interp/interp-internals.h#L121).

Since it would be easier to work with the structs in c, we added a new c file to the project with `<NativeFileReference>` and copied in the mono headers. Sure enough, when we passed in the address from GetFunctionPointer, we could read `ptr->method->name` and extract metadata from the function. Even with this though, we couldn't find the actual code pointer, as it was in a hash table that we didn't have the pointer to.

Suddenly, r58playz noticed something really cool: since everything was eventually compiling to a single `.wasm` file, the c program that we had just created was linked in the same step as the mono runtime itself. This meant that we could access any internal mono function or object just by name. We were more or less executing code inside the runtime itself.

With our new ability to call any internal function, we found `mono_method_get_header_internal`, and calling it with the pointer we found earlier finally allowed us to get to the code region.

Now we just needed to find out what bytes to inject into the method that would let us override the control flow in a way that's compatible with monomod.

By looking at the MSIL documentation and [this post](https://phrack.org/issues/70/6) we were eventually able to come up with something that worked:

- insert one `ldarg.i` (`0xFE 0x0X`) corresponding to each argument in the original method
- call `System.Reflection.Emit` to generate a new dynamic function with the exact same signature as the original method
- insert an `ldc.i4` (`0x20 <int32>`) and put in the delegate pointer for the function we just created
- finally, insert `calli` (`0x29`) to jump to the dynamic method
- add a return (`0x2A`) to prevent executing the rest of the function 

Once the hooked function is called, it runs our dynamic method, which will:
- `ldarg` each argument and store it in a temporary array
- call into our c method, restoring the original IL and invalidating the source method
- run the mod's hook function and return to monomod

Calling the function would make Mono assert at runtime though. It turns out that we need to load a "metadata token" to determine the method's signature before we run `calli`, and since the dynamic method is technically in a different assembly, it wouldn't be able to resolve it by default.

This was a simple fix though, since the dyn method has the same signature as the original one, we just had to clone the parent method's metadata in C and insert it into the internal mono hash table. 
This gave us a working detour system, but it turned out that last step broke in multithreaded mode, since each thread had it's own struct that needed to be modified.

There's probably a bypass for that, but at this point we figured it would just be easier to patch the runtime itself. After all, it's not like we have to worry about a user's individual setup, it's all running on the web.

Here's a simple patch, it would just clone the caller's signature when it saw our magic token `(0xF0F0F0F0)`, and we wouldn't need to mess with any tables

```diff
--- a/src/mono/mono/mini/interp/transform.c
+++ b/src/mono/mono/mini/interp/transform.c
@@ -3489,7 +3489,9 @@ interp_transform_call (TransformData *td, MonoMethod *method, MonoMethod *target
 	if (target_method == NULL) {
 		if (calli) {
-			if (method->wrapper_type != MONO_WRAPPER_NONE)
+			if (token == 0xF0F0F0F0)
+				csignature = method->signature;
+			else if (method->wrapper_type != MONO_WRAPPER_NONE)
 				csignature = (MonoMethodSignature *)mono_method_get_wrapper_data (method, token);
 			else {
```

Then, after recompiling dotnet, we could just put the patched sdk into the NuGet folder and have dotnet build the webassembly with our custom runtime.

Naturally, as with Everything C, we had somehow managed to trigger some memory corruption that the runtime wasn't happy about. But we got everything polished up eventually.

Now that we had a functional detour factory that worked in WebAssembly, we could slot it into MonoMod and start compiling everest.

# Everest

Finally, we could start loading mods at runtime


## hot reloading (move this?)

procedurline tries to hook a function that is way too tiny for our jump patch and crashes

we need to completely rethink the way we replace il

turns out mono already has a way to replace fns, hot reloading (used for debugging/fast dev cycles)

we lucked out, this is a "mono component" meaning we can completely replace it at link time with our own impl

it uses a g_hash_table to store ptrs to detoured code and look them up when mono wants to run a method

we just add a fn to the table and then tell mono to recompile the same way we did earlier

this doesn't work on runtime generated fns 

having a tiny runtime generated fn is pretty rare so it's an edge case we don't care about

replaced the detour system again with more oop interfaces to allow multiple "il detour backends"

this lets us use hot reload whenever possible and fall back to the old overwrite

## monomod.patcher (move?)

monomod.patcher works perfectly on wasm, we just need to expose copies of the dlls to the c# so it can read and relink with it

our first solution was using wasmfs fetch files and a service worker (dllsw) to redirect dlls to the "cachebusted" hash versions that dotnet uses

this sucked. really sucked. a ton. too many bugs to count.

instead we just decided to fetch the mappings once in the page and then use symlinks to redirect the dlls (should have done this first)

this was slow. and deadlocky. and didn't work on chromebooks because deadlock.

so we redid it to mount fetch backend once (turns out it makes a worker per fetch backend. obviously it's gonna deadlock at least once in like 30 files)

## race to strawberry jam

But years later and no one really uses blazor, so despite a pretty good effort on the parts of the .NET maintainers the web support is best considered a beta. A not-insignificant amount of time was spent working around \[.NET bugs\](https://github.com/dotnet/runtime/issues/112262)

Surprisingly, the rest of the mod compatibility issues were actually just subtle differences between the Mono Runtime and CoreCLR. No one plays Celeste on mono so no one noticed it.

First issue was a mod tripping a mono error during some reflection.

Again, the easiest way to get around this was just to patch the runtime. We're already running a modified sdk anyway, one more hackfix can't hurt.

FrostHelper won't load because the class override isn't valid? Well it is now.

```
--- a/src/mono/mono/metadata/class-setup-vtable.c
+++ b/src/mono/mono/metadata/class-setup-vtable.c
@@ -773,6 +773,7 @@ mono_method_get_method_definition (MonoMethod *method)
 static gboolean
 verify_class_overrides (MonoClass *klass, MonoMethod **overrides, int onum)
 {
+	return TRUE;
```

SecurityException? Who needs security anyway?

```
+++ b/src/mono/mono/metadata/class.c
@@ -6480,6 +6480,7 @@ can_access_member (MonoClass *access_klass, MonoClass *member_klass, MonoClass*
 gboolean
 mono_method_can_access_field (MonoMethod *method, MonoClassField *field)
 {
+	return TRUE;
```

The static initializer issue was also just fixed by bypassing a check in the vtable init

# Steam for wasm

\[sgen-alloc error\]

Oh! Thats not good. We kinda need AOT

This is an error during code generation, so it's something that would have also happened at runtime during interpreted mode if the function was used. So something else is tripping up 

Hey you know what time it is. Let's clone mono again and start recompiling with some new debug prints  
\[machelpers.cs\]  
Awesome. Fuck mac. Lets delete that file

# net10
net10 preview 1 just released with threads and jiterpereter support, it probably improves perf for celeste wasm

easy port to net 10, even monomod works perfectly after updating runtime patches

perf improves a lot while loading, but regressions prevent sj from loading


... present day ..
