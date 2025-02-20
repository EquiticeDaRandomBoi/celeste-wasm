using System;
using System.Threading;
using System.Threading.Tasks;
using System.Runtime.InteropServices.JavaScript;
using System.Runtime.InteropServices;
using System.IO;
using System.Reflection;
using System.Runtime.Loader;
using Microsoft.Xna.Framework;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Linq;
using System.IO.Compression;

/*
using QRCoder;
using SteamKit2;
using SteamKit2.CDN;
using DepotDownloader;
*/

[assembly: System.Runtime.Versioning.SupportedOSPlatform("browser")]


partial class JS
{
    [JSImport("newqr", "depot.js")]
    public static partial void newqr(string dataurl);
}


partial class Program
{
    private static void Main()
    {
        Console.WriteLine("Hi!");
    }

    [DllImport("Emscripten")]
    public extern static int mount_opfs();
    [DllImport("Emscripten")]
    public extern static int mount_fetch(string path);

    [DllImport("Emscripten")]
    public extern static void wasm_func_viil(Int32 x, Int32 y, Int64 l);

    internal static void CallPinvokeFixers()
    {
        wasm_func_viil(0, 0, 0);
    }

    [JSExport]
    internal static Task PreInit(String[] dlls)
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
                if (!Directory.Exists("/libsdl/Celeste/Saves"))
                    Directory.CreateDirectory("/libsdl/Celeste/Saves");
                File.CreateSymbolicLink("/Saves", "/libsdl/Celeste/Saves");

                if (!Directory.Exists("/libsdl/Celeste/Everest"))
                    Directory.CreateDirectory("/libsdl/Celeste/Everest");
                if (!Directory.Exists("/libsdl/Celeste/Mods"))
                    Directory.CreateDirectory("/libsdl/Celeste/Mods");

                // mono.cecil searches in /bin for some dlls
                Directory.CreateDirectory("/bin");
                Directory.CreateDirectory("/dlls");
                Parallel.ForEach(dlls, (dll) =>
                {
                    Console.WriteLine($"Mounting {dll}");
                    int fetchret = mount_fetch("/dlls/" + dll);
                    if (ret != 0)
                    {
                        throw new Exception($"Failed to mount {dll}");
                    }
                    File.CreateSymbolicLink("/bin/" + dll, "/dlls/" + dll);
                });
                File.CreateSymbolicLink("/bin/Celeste.exe", "/libsdl/CustomCeleste.dll");
                File.CreateSymbolicLink("/bin/Celeste.dll", "/libsdl/CustomCeleste.dll");
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

    [JSExport]
    internal static async Task<bool> PatchCeleste()
    {
        try
        {
            if (File.Exists("/libsdl/Celeste.exe") && !File.Exists("/libsdl/CustomCeleste.dll"))
            {
                Console.WriteLine("netcorefiering celeste");
                AotPatcher.AutoPatch("/libsdl/Celeste.exe", "/libsdl/CustomCeleste.dll");
                Console.WriteLine("netcorefiered celeste");
            }
            return true;
        }
        catch (Exception e)
        {
            Console.Error.WriteLine("Error in PatchCeleste()!");
            Console.Error.WriteLine(e);
            return false;
        }
    }

    static Game game;
    static Assembly celeste;

    [JSExport]
    internal static Task Init()
    {
        try
        {
            celeste = Assembly.LoadFrom("/libsdl/CustomCeleste.dll");
            Console.WriteLine($"CELESTE: {celeste}");

            AssemblyLoadContext.Default.ResolvingUnmanagedDll += (assembly, name) =>
            {
                Console.WriteLine($"Loading native lib \"{name}\"");
                if (name == "SDL2") name = "SDL3";
                return NativeLibrary.Load(name, assembly, null);
            };
            AssemblyLoadContext.Default.Resolving += (ctx, name) =>
            {
                Console.WriteLine($"Loading assembly \"{name.Name}\" \"{name}\"");
                try
                {
                    Assembly asm;

                    if (name.Name == "Celeste") asm = ctx.LoadFromAssemblyPath($"/libsdl/CustomCeleste.dll");
                    else if (name.Name == "Celeste.Mod.mm") asm = ctx.LoadFromAssemblyPath($"/libsdl/Celeste.Mod.mm.dll");
                    else asm = ctx.LoadFromAssemblyPath($"/libsdl/Celeste/Everest/{name.Name}.dll");

                    Console.WriteLine($"Loaded assembly \"{name.Name}\" \"{name}\": {asm}");
                    return asm;
                }
                catch (Exception err)
                {
                    Console.WriteLine("Failed");
                    Console.WriteLine(err);
                    return null;
                }
            };

            var Celeste = celeste.GetType("Celeste.Celeste");
            Console.WriteLine($"Celeste.Celeste: {Celeste}");
            var Settings = celeste.GetType("Celeste.Settings");
            Console.WriteLine($"Celeste.Settings: {Settings}");
            var Engine = celeste.GetType("Monocle.Engine");
            Console.WriteLine($"Monocle.Engine: {Engine}");

            var MainThreadId = Celeste.GetField("_mainThreadId", BindingFlags.Static | BindingFlags.NonPublic);
            Console.WriteLine($"Celeste.Celeste._mainThreadId: {MainThreadId}");
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
            AssemblyDirectory.SetValue(null, "/");
            Console.WriteLine($"ASSEMBLY DIRECTORY SET");

            SettingsInitialize.Invoke(null, []);
            Console.WriteLine($"SETTINGS INITIALIZED");

            var Everest = celeste.GetType("Celeste.Mod.Everest");
            if (Everest != null)
            {
                Console.WriteLine($"EVEREST DETECTED: {Everest}");
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
    internal static async Task<bool> ExtractEverest()
    {
        try
        {
            using (ZipArchive archive = ZipFile.OpenRead("/libsdl/everest.zip"))
            {
                string fileName = "Celeste.Mod.mm.dll";
                ZipArchiveEntry entry = archive.GetEntry("main/" + fileName);
                entry.ExtractToFile("/libsdl/" + fileName, true);
            }

            File.Delete("/libsdl/everest.zip");
            return true;
        }
        catch (Exception e)
        {
            Console.Error.WriteLine("Error in ExtractEverest()!");
            Console.Error.WriteLine(e);
            return false;
        }
    }

    /*
    [JSExport]
    internal static async Task<int> InitSteamSaved()
    {
        try
        {
            if (AccountSettingsStore.Instance.LoginTokens.Keys.Count > 0)
            {
                string username = AccountSettingsStore.Instance.LoginTokens.Keys.First();
                if (String.IsNullOrEmpty(username)) return 1;

                Console.WriteLine("Using saved login token for " + username);

                if (ContentDownloader.InitializeSteam3(username, null))
                {
                    return 0;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
            return 1;
        }
        return 1;
    }

    [JSExport]
    internal static async Task<bool> DownloadSteamCloud()
    {
        return await ContentDownloader.steam3.DownloadSteamCloud(504230, 100, "/libsdl/remote/");
    }

    [JSExport]
    internal static async Task<int> InitSteam(string username, string password, bool qr)
    {
        try
        {
            ContentDownloader.Config.UseQrCode = qr;
            Steam3Session.qrCallback = (QRCodeData q) =>
            {
                Console.WriteLine("Got QR code data");
                PngByteQRCode png = new PngByteQRCode(q);
                byte[] bytes = png.GetGraphic(20);
                string dataurl = "data:image/png;base64," + Convert.ToBase64String(bytes);
                JS.newqr(dataurl);
            };

            if (ContentDownloader.InitializeSteam3(username, password))
            {
                return 0;
            }
            else
            {
                Console.WriteLine("Error: InitializeSteam failed");
                return 1;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
        }


        return 1;
    }

    [JSExport]
    internal static async Task<int> DownloadApp()
    {
        var depotManifestIds = new List<(uint, ulong)>();
        depotManifestIds.Add((504233, 5880027853585448535));

        try
        {
            await ContentDownloader.DownloadAppAsync(504230, depotManifestIds, "public", null, null, null, false, false).ConfigureAwait(false);
            return 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine("Could not download app: " + ex.Message);
            return 1;
        }
    }

	*/

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
