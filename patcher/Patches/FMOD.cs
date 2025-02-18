using MonoMod;
using System;
using FMOD;

namespace CelestePatcher
{
    public class patch_FMOD_Studio_System
    {
		[MonoModLinkFrom("FMOD.Studio.System::create")]
        public static RESULT create(out FMOD.Studio.System studiosystem)
        {
            RESULT rESULT = RESULT.OK;
            studiosystem = null;
            rESULT = WRAP_FMOD_Studio_System_Create(out var studiosystem2, 0x00020222u);
            if (rESULT != 0)
            {
                return rESULT;
            }
            studiosystem = new FMOD.Studio.System(studiosystem2);
            return rESULT;
        }

		[MonoModLinkTo("FMOD.Studio.System::FMOD_Studio_System_Create")]
		private static extern RESULT WRAP_FMOD_Studio_System_Create(out IntPtr studiosystem, uint headerversion);
    }
}
