using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Runtime.InteropServices.JavaScript;
using System.Runtime.InteropServices;
using System.IO.Compression;
using Mono.Cecil;
using MonoMod;

public partial class AotPatcher
{

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

    [JSExport]
    internal static async Task<bool> ExtractEverest()
    {
        try
        {
            string everestPath = "/libsdl/Celeste/Everest/";
            Directory.CreateDirectory(everestPath);
            using (ZipArchive archive = ZipFile.OpenRead("/libsdl/everest.zip"))
            {
                foreach (ZipArchiveEntry entry in archive.Entries)
                {
                    if (entry.FullName.EndsWith("/")) continue;
                    string path = everestPath + entry.FullName.Substring(entry.FullName.IndexOf('/') + 1);
                    Directory.CreateDirectory(Path.GetDirectoryName(path));
                    entry.ExtractToFile(path, true);
                }
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

    public ModuleDefinition Module;

    public static void AutoPatch(string src, string dst)
    {
        AotPatcher patcher = new(src);
        patcher.patch();
        patcher.write(dst);
    }

    public AotPatcher(string path)
    {
        ReaderParameters readerParams = new(ReadingMode.Immediate) { ReadSymbols = false, InMemory = true };
        MemoryStream stream = new(File.ReadAllBytes(path));
        Module = ModuleDefinition.ReadModule(stream, readerParams);
    }

    public void patch()
    {

        // TODO: account for the user uploading their own everest

        ModuleDefinition everest = ModuleDefinition.ReadModule("/libsdl/Celeste/Everest/Celeste.Mod.mm.dll");
        using (MonoModder modder = new()
        {
            Module = Module,
            Mods = [everest],
            MissingDependencyThrow = false,
        })
        {
            modder.DependencyDirs.Add("/bin");
            modder.DependencyDirs.Add("/libsdl/Celeste/Everest");
            modder.Log("Converting Celeste to NET Core");
            NETCoreifier.Coreifier.ConvertToNetCore(modder);

            modder.Log("Installing Everest");
            modder.MapDependencies();
            modder.AutoPatch();
        }


        ModuleDefinition wasmMod = ModuleDefinition.ReadModule("/bin/Celeste.Wasm.mm.dll");
        using (MonoModder modder = new()
        {
            Module = Module,
            Mods = [wasmMod],
            MissingDependencyThrow = false,
        })
        {
            modder.DependencyDirs.Add("/bin");
            modder.DependencyDirs.Add("/libsdl/Celeste/Everest");

            modder.Log("Installing WASM patches");
            modder.MapDependencies();
            modder.AutoPatch();
        }
    }

    public void write(string path)
    {
        Module.Write(path, new WriterParameters() { WriteSymbols = false });
    }
}
