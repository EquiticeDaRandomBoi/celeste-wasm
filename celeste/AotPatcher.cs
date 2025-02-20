using System.IO;
using Mono.Cecil;
using MonoMod;

public class AotPatcher
{
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
        ModuleDefinition everest = ModuleDefinition.ReadModule("/libsdl/Celeste.Mod.mm.dll");
        ModuleDefinition wasmMod = ModuleDefinition.ReadModule("/bin/Celeste.Wasm.mm.dll");
        using (MonoModder modder = new()
        {
            Module = Module,
            Mods = [wasmMod],
            MissingDependencyThrow = false,
        })
        {
            modder.DependencyDirs.Add("/bin/");
            NETCoreifier.Coreifier.ConvertToNetCore(modder);
            modder.Log("NETCoreifier finished");

            modder.MapDependencies();
            modder.AutoPatch();
        }
    }

    public void write(string path)
    {
        Module.Write(path, new WriterParameters() { WriteSymbols = false });
    }
}
