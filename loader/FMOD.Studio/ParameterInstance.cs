using System;
using System.Runtime.InteropServices;

namespace FMOD.Studio;

public class ParameterInstance : HandleBase
{
	public RESULT getDescription(out PARAMETER_DESCRIPTION description)
	{
		/*
		description = default(PARAMETER_DESCRIPTION);
		PARAMETER_DESCRIPTION_INTERNAL description2;
		RESULT rESULT = WRAP_FMOD_Studio_ParameterInstance_GetDescription(rawPtr, out description2);
		if (rESULT != 0)
		{
			return rESULT;
		}
		description2.assign(out description);
		return rESULT;
		*/
		throw new NotSupportedException("ParameterInstance was removed in FMOD 2.");
	}

	public RESULT getValue(out float value)
	{
		//return WRAP_FMOD_Studio_ParameterInstance_GetValue(rawPtr, out value);
		throw new NotSupportedException("ParameterInstance was removed in FMOD 2.");
	}

	public RESULT setValue(float value)
	{
		//return WRAP_FMOD_Studio_ParameterInstance_SetValue(rawPtr, value);
		throw new NotSupportedException("ParameterInstance was removed in FMOD 2.");
	}

	/*
	[DllImport("fmodstudio")]
	private static extern bool WRAP_FMOD_Studio_ParameterInstance_IsValid(IntPtr parameter);

	[DllImport("fmodstudio")]
	private static extern RESULT WRAP_FMOD_Studio_ParameterInstance_GetDescription(IntPtr parameter, out PARAMETER_DESCRIPTION_INTERNAL description);

	[DllImport("fmodstudio")]
	private static extern RESULT WRAP_FMOD_Studio_ParameterInstance_GetValue(IntPtr parameter, out float value);

	[DllImport("fmodstudio")]
	private static extern RESULT WRAP_FMOD_Studio_ParameterInstance_SetValue(IntPtr parameter, float value);
	*/

	public ParameterInstance(IntPtr raw)
		: base(raw)
	{
	}

	protected override bool isValidInternal()
	{
		//return WRAP_FMOD_Studio_ParameterInstance_IsValid(rawPtr);
		throw new NotSupportedException("ParameterInstance was removed in FMOD 2.");
	}
}
