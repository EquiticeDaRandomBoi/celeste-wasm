using System;
using System.Threading;
using System.Threading.Tasks;
using System.Runtime.InteropServices.JavaScript;
using System.Runtime.InteropServices;
using System.IO;
using System.Reflection;
using System.Runtime.Loader;
using Microsoft.Xna.Framework;

[assembly: System.Runtime.Versioning.SupportedOSPlatform("browser")]

partial class Program
{
    private static void Main()
    {
        Console.WriteLine("Hi!");
    }

    [DllImport("Emscripten")]
    public extern static int mount_opfs();
    [DllImport("Emscripten")]
    public extern static void wasm_func_viil(Int32 x, Int32 y, Int64 l);

    internal static void CallPinvokeFixers()
    {
        wasm_func_viil(0, 0, 0);
    }

    [JSExport]
    internal static Task PreInit()
    {
        return Task.Run(() =>
        {
            try
            {
                CallPinvokeFixers();
                Console.WriteLine("fixed pinvoke");

                int ret = mount_opfs();
                Console.WriteLine($"called mount_opfs: {ret}");
                if (ret != 0)
                {
                    throw new Exception("Failed to mount OPFS");
                }

                File.CreateSymbolicLink("/Content", "/libsdl/Content");

                // everest saves to /Saves instead of opfs
                if (!Directory.Exists("/libsdl/Saves"))
                    Directory.CreateDirectory("/libsdl/Saves");
                File.CreateSymbolicLink("/Saves", "/libsdl/Saves");
                Console.WriteLine("created symlinks");
            }
            catch (Exception e)
            {
                Console.Error.WriteLine("Error in PreInit()!");
                Console.Error.WriteLine(e);
                throw;
            }
        });
    }

    static Game game;
    static Assembly celeste;

    [JSExport]
    internal static Task Init()
    {
        try
        {
            if (File.Exists("/libsdl/CustomCeleste.dll"))
            {
                celeste = Assembly.LoadFile("/libsdl/CustomCeleste.dll");
            }
            else
            {
                celeste = Assembly.GetEntryAssembly();
            }
            Console.WriteLine($"CELESTE: {celeste}");

            AssemblyLoadContext.Default.ResolvingUnmanagedDll += (assembly, name) =>
            {
                Console.WriteLine($"Loading native lib \"{name}\"");
                if (name == "SDL2") name = "SDL3";
                return NativeLibrary.Load(name, assembly, null);
            };

            var Celeste = celeste.GetType("Celeste.Celeste");
            Console.WriteLine($"Celeste.Celeste: {Celeste}");
            var Settings = celeste.GetType("Celeste.Settings");
            Console.WriteLine($"Celeste.Settings: {Settings}");
            var Engine = celeste.GetType("Monocle.Engine");
            Console.WriteLine($"Monocle.Engine: {Engine}");

            var MainThreadId = Celeste.GetField("_mainThreadId", BindingFlags.Static | BindingFlags.NonPublic);
            Console.WriteLine($"Celeste.Celeste._mainThreadId: {MainThreadId}");
            var IsGGP = Celeste.GetField("IsGGP", BindingFlags.Static | BindingFlags.Public);
            Console.WriteLine($"Celeste.Celeste.IsGGP: {IsGGP}");
            var AssemblyDirectory = Engine.GetField("AssemblyDirectory", BindingFlags.Static | BindingFlags.NonPublic);
            Console.WriteLine($"Engine.AssemblyDirectory: {AssemblyDirectory}");
            var SettingsInitialize = Settings.GetMethod("Initialize", BindingFlags.Static | BindingFlags.Public);
            Console.WriteLine($"Settings.Initialize: {SettingsInitialize}");
            var GameConstructor = Celeste.GetConstructor([]);
            Console.WriteLine($"Celeste.Celeste..ctor: {GameConstructor}");

            Hooks.Initialize(celeste);
            Console.WriteLine($"HOOKS INITIALIZED");
            MainThreadId.SetValue(null, Thread.CurrentThread.ManagedThreadId);
            Console.WriteLine($"MAIN THREAD INITIALIZED");
            IsGGP.SetValue(null, true);
            Console.WriteLine($"GGP SET");
            AssemblyDirectory.SetValue(null, "/");
            Console.WriteLine($"ASSEMBLY DIRECTORY SET");

            SettingsInitialize.Invoke(null, []);
            Console.WriteLine($"SETTINGS INITIALIZED");

            var Everest = celeste.GetType("Celeste.Mod.Everest");
            if (Everest != null)
            {
                Console.WriteLine($"EVEREST DETECTED: ", Everest);
                var ParseArgs = Everest.GetMethod("ParseArgs", BindingFlags.Static | BindingFlags.NonPublic);
                ParseArgs.Invoke(null, [new string[] { }]);
            }

            game = (Game)GameConstructor.Invoke([]);
            Console.WriteLine($"CELESTE CREATED");
        }
        catch (Exception e)
        {
            Console.Error.WriteLine("Error in Init()!");
            Console.Error.WriteLine(e);
            return Task.FromException(e);
        }
        return Task.Delay(0);
    }

    [JSExport]
    internal static Task Cleanup()
    {
        try
        {
            celeste.GetType("Celeste.RunThread").GetMethod("WaitAll").Invoke(null, []);
            game.Dispose();
            celeste.GetType("Celeste.Audio").GetMethod("Unload").Invoke(null, []);
        }
        catch (Exception e)
        {
            Console.Error.WriteLine("Error in Cleanup()!");
            Console.Error.WriteLine(e);
            return Task.FromException(e);
        }
        return Task.Delay(0);
    }

    [JSExport]
    internal static Task<bool> MainLoop()
    {
        try
        {
            game.RunOneFrame();
        }
        catch (Exception e)
        {
            Console.Error.WriteLine("Error in MainLoop()!");
            Console.Error.WriteLine(e);
            return (Task<bool>)Task.FromException(e);
        }
        return Task.FromResult(game.RunApplication);
    }
}
