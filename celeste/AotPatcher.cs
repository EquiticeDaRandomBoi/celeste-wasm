using System;
using System.IO;
using System.Reflection;
using Mono.Cecil;
using System.Linq;
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
        ModuleDefinition mod = ModuleDefinition.ReadModule("/bin/Celeste.Wasm.mm.dll");
        using (MonoModder modder = new()
        {
            Module = Module,
            Mods = [mod],
            MissingDependencyThrow = false,
        })
        {
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
