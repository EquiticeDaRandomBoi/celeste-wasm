# Porting Terraria and Celeste to WebAssembly

Both Celeste and Terraria were written using XNA, a proprietary low level game "engine" developed and subsequently abandoned by Microsoft. It was eventually replaced with the community maintained FNA library, including a SDL backend and full WebGL support.

Like Java, C# compiles to a platform-independent bytecode format. Common Intermediate Language (referred to as MSIL or just IL) was designed to map very closesly to the original code. The game binaries are typically provided with symbols for both function names and local variables, so the output from the decompiler is typically about as close to the original source as possible.

Starting with .NET 5, Microsoft released Blazor in an attempt to take over the frontend world with C#'s "Enterprise Reliability", and with it came the ability to run any C# in WebAssembly


## demo part
<!-- here i'm gonna have it be like walking through the process -->

The first step is setting up a development environment for modding
Let's open up Terraria.exe with `ilspycmd` and try to get a project going.

After removing the platform specific code for windows and adding back the assembly references for dependencies, the project recompiles and launches on linux.

Install the wasm sdk, then we can change the build type to a web project

All of the project code compiles without issue, but FNA is partially written in c++ and needs to be linked against its native components

the web target isn't officially supported by FNA, but its native components compile without issue under emscripten's opengl emulation layer

add the reference to the project

and it launches
image of relogic logo

but threads aren't supported so it aborts at runtime. set wasmenablethreads

with threads, all code runs inside web workers. the "main" thread is the deputy thread.

sdl2 does not have good offscreencanvas support

add wrap_fna.fish explanation here

at first we just committed the entire source code into a private repository








<!-- not sure where to put this yet -->

But years later and no one really uses blazor, so despite a pretty good effort on the parts of the .NET maintainers the web support is best considered a beta. A not-insignificant amount of time was spent working around [.NET bugs](https://github.com/dotnet/runtime/issues/112262)


i wanna talk about https://github.com/dotnet/runtime/issues/57976 somewhere



<!-- uhh put this in the introduction to the monomod section -->

it's a little easier to understand the pitfalls of NET's WASM SDK when you look at the history of .NET Core

The .NET platform used to be windows only and very closed source, along with a number of other limitations. Microsoft took so long to fix these that the [Mono Project]() was created to reimplement the .NET runtime.

Microsoft [bought out Xamarin](https://blogs.microsoft.com/blog/2016/02/24/microsoft-to-acquire-xamarin-and-empower-more-developers-to-build-apps-on-any-device/) in 2016 and accquired Mono. A new CLR backend was merged with Mono's runtime and AOT tooling to create the horrifying amalgamation that became known as .NET Core.

This left the original mono project to fall behind, and eventually was left up to the wine project to maintain, leaving it as yet another example of Microsoft's [Embrace, Extend, Extingish](https://en.wikipedia.org/wiki/Embrace,_extend,_and_extinguish) strategy.

What does this mean for us? The browser runtime is actually just Mono, with bits of .NET Core merged in. With Ahead-Of-Time Compilation disabled, it's running in full interpreted mode, reading IL on the fly






