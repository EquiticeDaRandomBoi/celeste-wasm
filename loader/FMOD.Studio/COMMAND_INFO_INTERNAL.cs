using System;

namespace FMOD.Studio;

internal struct COMMAND_INFO_INTERNAL
{
	public IntPtr commandname;

	public int parentcommandindex;

	public int framenumber;

	public float frametime;

	public INSTANCETYPE instancetype;

	public INSTANCETYPE outputtype;

	public uint instancehandle;

	public uint outputhandle;

	public COMMAND_INFO createPublic()
	{
		COMMAND_INFO result = default(COMMAND_INFO);
		result.commandname = MarshallingHelper.stringFromNativeUtf8(commandname);
		result.parentcommandindex = parentcommandindex;
		result.framenumber = framenumber;
		result.frametime = frametime;
		result.instancetype = instancetype;
		result.outputtype = outputtype;
		result.instancehandle = instancehandle;
		result.outputhandle = outputhandle;
		return result;
	}
}
