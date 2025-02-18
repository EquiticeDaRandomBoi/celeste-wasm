using Mono.Cecil;
using MonoMod.InlineRT;
using System.Collections.Generic;

namespace MonoMod
{
    static partial class MonoModRules
    {
        static Dictionary<string, string> FMODMappings = new() {
            { "FMOD_Studio_System_GetLowLevelSystem", "FMOD_Studio_System_GetCoreSystem" },
            { "FMOD_Studio_System_SetListenerAttributes", "FMOD_Studio_System_SetListenerAttributes_2" }
        };

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
                if (FMODMappings.TryGetValue(method.PInvokeInfo.EntryPoint, out var remapped))
                {
                    method.PInvokeInfo.EntryPoint = "WRAP_" + remapped;
                }
                else
                {
                    method.PInvokeInfo.EntryPoint = "WRAP_" + method.PInvokeInfo.EntryPoint;
                }
            }
        }
    }
}
