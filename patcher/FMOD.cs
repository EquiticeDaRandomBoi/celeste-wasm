using System;
using MonoMod;

namespace FMOD.Studio 
{
    public class patch_System: System
    {
		private static extern RESULT FMOD_Studio_System_Create(out IntPtr studiosystem, uint headerversion);

        public patch_System(IntPtr x)
            : base(x) {
            // no-op. MonoMod ignores this - we only need this to make the compiler shut up.
        }

		[MonoModReplace]
        public new static RESULT create(out FMOD.Studio.System studiosystem)
        {
            RESULT rESULT = RESULT.OK;
            studiosystem = null;
            rESULT = FMOD_Studio_System_Create(out var studiosystem2, 0x00020222u);
            if (rESULT != 0)
            {
                return rESULT;
            }
            studiosystem = new FMOD.Studio.System(studiosystem2);
            return rESULT;
        }
    }
}
