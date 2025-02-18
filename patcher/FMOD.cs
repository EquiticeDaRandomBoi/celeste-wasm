using System;
using Mono.Cecil;
using Mono.Cecil.Cil;
using MonoMod;
using MonoMod.Cil;
using MonoMod.InlineRT;

namespace FMOD.Studio
{
    public class patch_System : System
    {
        public patch_System(IntPtr x)
            : base(x)
        {
            // no-op. MonoMod ignores this - we only need this to make the compiler shut up.
        }

        [MonoModIgnore]
        [PatchFMODVersion]
        public extern static RESULT create(out FMOD.Studio.System studiosystem);
    }
}

namespace MonoMod
{
    /// <summary>
    /// Patch the FMOD.Studio.System.create method instead of reimplementing it in CelesteWasm.
    /// </summary>
    [MonoModCustomMethodAttribute(nameof(MonoModRules.PatchFMODVersion))]
    class PatchFMODVersionAttribute : Attribute { }

    static partial class MonoModRules
    {
        public static void PatchFMODVersion(ILContext context, CustomAttribute attrib)
        {
			foreach (Instruction instr in context.Instrs) {
				Console.WriteLine($"INSTR {instr.OpCode} {instr.Operand}");
			}

			ILCursor cursor = new(context);
			cursor.GotoNext(i => i.MatchLdcI4(out var num) && num == 69652);

			if (!context.Instrs[cursor.Index].MatchLdcI4(out var _))
				throw new Exception("should never happen");

			context.Instrs[cursor.Index].Operand = (int)0x00020222;
			MonoModRule.Modder.Log("[FMODPatcher] Patched FMOD Version");
        }
    }
}
