using System;
using System.IO;
using System.Reflection;
using Mono.Cecil;
using System.Linq;
using MonoMod;

class AotModder : MonoModder
{
    public void AddReferenceIfMissing(AssemblyName asmName)
    {
        if (!Module.AssemblyReferences.Any(asmRef => asmRef.Name == asmName.Name))
        {
            Module.AssemblyReferences.Add(AssemblyNameReference.Parse(asmName.FullName));
        }
    }

    public void AddReferenceIfMissing(string name) => AddReferenceIfMissing(Assembly.GetExecutingAssembly().GetReferencedAssemblies().First(asmName => asmName.Name == name));

    public override ModuleDefinition DefaultMissingDependencyResolver(MonoModder mod, ModuleDefinition main, string name, string fullName)
    {
        Console.WriteLine($"Failed to resolve {name}");
        return base.DefaultMissingDependencyResolver(mod, main, name, fullName);
    }

    public override void MapDependencies()
    {
        // Ensure critical references are present
        AddReferenceIfMissing("System.Runtime");

        base.MapDependencies();
    }

}

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
        using (AotModder modder = new()
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
