# Porting Terraria and Celeste to WebAssembly

I’ve always been interested in weird things running in the browser, so when I saw an old post of someone running a half working copy of the game Celeste in the browser, I knew I had to try and recreate it myself.

Both Celeste and Terraria were written using XNA, a proprietary low level C# game "engine" developed and subsequently abandoned by Microsoft. It was eventually replaced with the community maintained FNA library, including a SDL backend and greater platform support.

Like Java, C# compiles to a platform-independent bytecode format. Common Intermediate Language (referred to as MSIL or just IL) was designed to map very closely to the original code. The game binaries are typically provided with symbols for both function names and local variables, so the output from the decompiler is typically about as close to the original source as possible.

Starting with .NET 5, Microsoft released Blazor in an attempt to take over the frontend world with C#'s "Enterprise Reliability", and with it came the ability to run any C# in WebAssembly

thanks r58 for figuring most of this stuff out and bomberfish for making a cool ui

## Terraria

Without knowing much about C# in general we figured a good place to start was setting up a development environment for modding  
Let's open up Terraria.exe with `ilspycmd` and try to get a project going.

After removing the platform specific code for windows and adding back the assembly references for dependencies, the project recompiles and launches on linux.

Install the wasm sdk, then we can change the build type to a web project

```
<Project Sdk="Microsoft.NET.Sdk.WebAssembly">
<ItemGroup>
		<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
		<PackageReference Include="Newtonsoft.Json.Bson" Version="1.0.3" />
		<PackageReference Include="DotNetZip" Version="1.16.0" />
		<PackageReference Include="MP3Sharp" Version="1.0.5" />
		<PackageReference Include="NVorbis" Version="0.10.5" />

```

All of the project code compiles without issue, but FNA is partially written in c++ and needs to be linked against its native components. The web target isn't officially supported by FNA, but its native components compile without issue under emscripten's opengl emulation layer. fortunately someone already made a tool for this

add the reference to the project

```
		<!-- FNA -->
		<NativeFileReference Include="SDL3.a" />
		<NativeFileReference Include="FNA3D.a" />
		<NativeFileReference Include="libmojoshader.a" />
		<NativeFileReference Include="FAudio.a" />
```

and it launches  
image of relogic logo

but threads aren't supported so it aborts at runtime. set wasmenablethreads

with threads, all code runs inside web workers. the "main" thread is the deputy thread.

sdl2 does not have good offscreencanvas support

add wrap_fna.fish explanation here

at first we just committed the entire source code into a private repository

# celeste

 \-sWASMFS  
Celeste is also FNA, so we went through the same process

This time FNA needed to be patched

However, by this time SDL3 was stable so we didn’t need the proxy hack

And now we have a proper system for applying patches too

Celeste is great but what about everest?  
A mod loader is generally built around two components, a patched version of the game that provides an api, and a method of loading code at runtime and modifying behavior

Both are provided by MonoMod, an instrumentation framework

the patcher part modifies the game on disk, so no problem there. but the runtime modifications use RuntimeDetour, which is very not supported on webassembly 

I’ll explain how we ported it to NET's WASM SDK, but first it will help to take a little detour (haha) into the history of .NET Core

# netcore

The .NET platform used to be windows only and very closed source, along with a number of other limitations. Microsoft took so long to fix these that the [Mono Project]() was created to reimplement the .NET runtime.

Microsoft [bought out Xamarin](https://blogs.microsoft.com/blog/2016/02/24/microsoft-to-acquire-xamarin-and-empower-more-developers-to-build-apps-on-any-device/) in 2016 and accquired Mono. A new runtime backend (CoreCLR) was merged with Mono's platform support and AOT tooling to create the horrifying amalgamation that became known as .NET Core.

This left the original mono project to fall behind, and eventually was left up to the wine project to maintain, leaving it as yet another example of Microsoft's [Embrace, Extend, Extingish](https://en.wikipedia.org/wiki/Embrace,_extend,_and_extinguish) strategy.

What does this mean for us? The browser runtime is actually just regular Mono inside emscripten with bits of .NET Core merged in, whereas outside of the browser, code runs on the new CoreCLR runtime. With Ahead-Of-Time Compilation disabled, it's running in full interpreted mode, reading IL on the fly.

# MonoMod

The module works with Function Detouring, a term usually associated game cheating

CoreCLR has a JIT engine that compiles every function to native machine code before function execution

Oversimplifying a little, MonoMod on desktop hooks into functions by:

- Copy the original method’s bytecode into a new controlled method with modifications  
- Call MethodBase.GetFunctionPointer() or thunk the runtime to retrieve pointers to the executable regions in memory that the jit code is held in  
- Ask the kernel to disable write protection on the pages of memory where the jitted code is  
- Writes the bytes for a long jmp (`0xFF 0x25 + pointer`) into the start of the function to redirect the control flow back into MonoMod.  
- Force the JIT code for the new modified method to generate and move the control flow there

https://github.com/MonoMod/MonoMod/blob/reorganize/src/MonoMod.Core/Platforms/Architectures/x86\_64Arch.cs\#L266  
This works because all functions run through the coreclr jit and  have corresponding native code regions

However, Mono WASM does not work this way. It runs in mostly interpreted mode with a limited “jit-traces” engine called the jiterpreter, meaning not every method will have corresponding native code, and even if it did \- WebAssembly modules are read only, you can add new code at runtime, but you can’t just hot patch existing code to mess with the internal state. WebAssembly is AOT compiled to native code on module instantiation

Instead we have to do a fully managed detour instead of a native one

# Everest

Now that we had a proper way to hook into functions at runtime we could start injecting the everest mod loader into celeste.

But years later and no one really uses blazor, so despite a pretty good effort on the parts of the .NET maintainers the web support is best considered a beta. A not-insignificant amount of time was spent working around \[.NET bugs\](https://github.com/dotnet/runtime/issues/112262)

Finally, we could start loading mods at runtime  
Surprisingly, the rest of the mod compatibility issues were actually just subtle differences between the Mono Runtime and CoreCLR. No one plays Celeste on mono so no one noticed it.

First issue was a mod tripping a mono error during some reflection.

Again, the easiest way to get around this was just to patch the runtime. We’re already running a modified sdk anyway, one more hackfix can’t hurt.

FrostHelper won’t load because the class override isn’t valid? Well it is now.

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

This is an error during code generation, so it’s something that would have also happened at runtime during interpreted mode if the function was used. So something else is tripping up 

Hey you know what time it is. Let’s clone mono again and start recompiling with some new debug prints  
\[machelpers.cs\]  
Awesome. Fuck mac. Lets delete that file
