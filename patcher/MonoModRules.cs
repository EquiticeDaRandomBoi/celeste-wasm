using Mono.Cecil;
using MonoMod.InlineRT;

namespace MonoMod
{
    static partial class MonoModRules
    {
        static MonoModRules()
        {
			MonoModRule.Modder.PostProcessors += FMODPostProcessor;
        }

        public static void FMODPostProcessor(MonoModder modder)
        {
            foreach (TypeDefinition type in modder.Module.Types)
                foreach (MethodDefinition method in type.Methods)
                    FMODPostProcessMethod(modder, method);
        }
        public static void FMODPostProcessMethod(MonoModder modder, MethodDefinition method)
        {
            if (!method.HasBody && method.HasPInvokeInfo && method.PInvokeInfo.Module.Name.StartsWith("fmod"))
            {
                modder.Log($"[FMODPatcher] Wrapping {method.FullName} -> {method.PInvokeInfo.Module.Name}::{method.PInvokeInfo.EntryPoint}");
                method.PInvokeInfo.EntryPoint = "WRAP_" + method.PInvokeInfo.EntryPoint;
            }
        }
    }
}
