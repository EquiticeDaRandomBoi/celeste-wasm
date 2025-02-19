using MonoMod;
using System;
using Mono.Cecil;

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
				foreach (var dep in celeste.AssemblyReferences) {
					Console.WriteLine($"DEP: {dep}");
				}
                orig_InitMMFlags(modder);
            }
        }
    }
}
