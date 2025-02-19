using MonoMod;
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
				modder.DependencyDirs.Add("/bin/");

                orig_InitMMFlags(modder);
            }
        }
    }
}
