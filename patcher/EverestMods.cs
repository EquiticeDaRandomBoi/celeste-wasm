using MonoMod;
using Mono.Cecil;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;

namespace Celeste.Mod
{
    public static partial class Everest
    {
        public static class patch_Relinker
        {
            private static extern void orig_InitMMFlags(MonoModder modder);
            private static void InitMMFlags(MonoModder modder)
            {
                modder.LogVerboseEnabled = true;

                var celeste = ModuleDefinition.ReadModule("/bin/Celeste.dll");
                modder.DependencyCache[celeste.Assembly.FullName] = celeste;
                modder.DependencyDirs.Add("/bin/");

                orig_InitMMFlags(modder);
            }
        }
    }

    public sealed class EverestModuleAssemblyContext
    {
        private static readonly Dictionary<string, AssemblyDefinition> _GlobalAssemblyResolveCache = new Dictionary<string, AssemblyDefinition>();

        private extern AssemblyDefinition orig_ResolveGlobal(AssemblyNameReference asmName);

        private AssemblyDefinition ResolveGlobal(AssemblyNameReference asmName)
        {
            try
            {
                AssemblyDefinition def = ModuleDefinition.ReadModule($"/bin/{asmName.Name}.dll").Assembly;
                _GlobalAssemblyResolveCache.Add(asmName.Name, def);
                Console.WriteLine($"Hook resolved {asmName} to {def}");
            }
            catch (Exception e)
            {
                Console.WriteLine($"Failed to resolve {asmName.Name} {asmName}");
                Console.WriteLine(e);
            }

            AssemblyDefinition ret = orig_ResolveGlobal(asmName);
            Console.WriteLine($"Resolved {asmName} to {ret}");
            return ret;
        }
    }
}
