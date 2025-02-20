using System;
using System.Runtime.InteropServices;
using System.Text;

namespace FMOD;

public class DSP : HandleBase
{
	public RESULT release()
	{
		RESULT num = WRAP_FMOD_DSP_Release(getRaw());
		if (num == RESULT.OK)
		{
			rawPtr = IntPtr.Zero;
		}
		return num;
	}

	public RESULT getSystemObject(out System system)
	{
		system = null;
		IntPtr system2;
		RESULT result = WRAP_FMOD_DSP_GetSystemObject(rawPtr, out system2);
		system = new System(system2);
		return result;
	}

	public RESULT addInput(DSP target, out DSPConnection connection, DSPCONNECTION_TYPE type = DSPCONNECTION_TYPE.STANDARD)
	{
		connection = null;
		IntPtr connection2;
		RESULT result = WRAP_FMOD_DSP_AddInput(rawPtr, target.getRaw(), out connection2, type);
		connection = new DSPConnection(connection2);
		return result;
	}

	public RESULT disconnectFrom(DSP target, DSPConnection connection = null)
	{
		return WRAP_FMOD_DSP_DisconnectFrom(rawPtr, target.getRaw(), (connection != null) ? connection.getRaw() : ((IntPtr)0));
	}

	public RESULT disconnectAll(bool inputs, bool outputs)
	{
		return WRAP_FMOD_DSP_DisconnectAll(rawPtr, inputs, outputs);
	}

	public RESULT getNumInputs(out int numinputs)
	{
		return WRAP_FMOD_DSP_GetNumInputs(rawPtr, out numinputs);
	}

	public RESULT getNumOutputs(out int numoutputs)
	{
		return WRAP_FMOD_DSP_GetNumOutputs(rawPtr, out numoutputs);
	}

	public RESULT getInput(int index, out DSP input, out DSPConnection inputconnection)
	{
		input = null;
		inputconnection = null;
		IntPtr input2;
		IntPtr inputconnection2;
		RESULT result = WRAP_FMOD_DSP_GetInput(rawPtr, index, out input2, out inputconnection2);
		input = new DSP(input2);
		inputconnection = new DSPConnection(inputconnection2);
		return result;
	}

	public RESULT getOutput(int index, out DSP output, out DSPConnection outputconnection)
	{
		output = null;
		outputconnection = null;
		IntPtr output2;
		IntPtr outputconnection2;
		RESULT result = WRAP_FMOD_DSP_GetOutput(rawPtr, index, out output2, out outputconnection2);
		output = new DSP(output2);
		outputconnection = new DSPConnection(outputconnection2);
		return result;
	}

	public RESULT setActive(bool active)
	{
		return WRAP_FMOD_DSP_SetActive(rawPtr, active);
	}

	public RESULT getActive(out bool active)
	{
		return WRAP_FMOD_DSP_GetActive(rawPtr, out active);
	}

	public RESULT setBypass(bool bypass)
	{
		return WRAP_FMOD_DSP_SetBypass(rawPtr, bypass);
	}

	public RESULT getBypass(out bool bypass)
	{
		return WRAP_FMOD_DSP_GetBypass(rawPtr, out bypass);
	}

	public RESULT setWetDryMix(float prewet, float postwet, float dry)
	{
		return WRAP_FMOD_DSP_SetWetDryMix(rawPtr, prewet, postwet, dry);
	}

	public RESULT getWetDryMix(out float prewet, out float postwet, out float dry)
	{
		return WRAP_FMOD_DSP_GetWetDryMix(rawPtr, out prewet, out postwet, out dry);
	}

	public RESULT setChannelFormat(CHANNELMASK channelmask, int numchannels, SPEAKERMODE source_speakermode)
	{
		return WRAP_FMOD_DSP_SetChannelFormat(rawPtr, channelmask, numchannels, source_speakermode);
	}

	public RESULT getChannelFormat(out CHANNELMASK channelmask, out int numchannels, out SPEAKERMODE source_speakermode)
	{
		return WRAP_FMOD_DSP_GetChannelFormat(rawPtr, out channelmask, out numchannels, out source_speakermode);
	}

	public RESULT getOutputChannelFormat(CHANNELMASK inmask, int inchannels, SPEAKERMODE inspeakermode, out CHANNELMASK outmask, out int outchannels, out SPEAKERMODE outspeakermode)
	{
		return WRAP_FMOD_DSP_GetOutputChannelFormat(rawPtr, inmask, inchannels, inspeakermode, out outmask, out outchannels, out outspeakermode);
	}

	public RESULT reset()
	{
		return WRAP_FMOD_DSP_Reset(rawPtr);
	}

	public RESULT setParameterFloat(int index, float value)
	{
		return WRAP_FMOD_DSP_SetParameterFloat(rawPtr, index, value);
	}

	public RESULT setParameterInt(int index, int value)
	{
		return WRAP_FMOD_DSP_SetParameterInt(rawPtr, index, value);
	}

	public RESULT setParameterBool(int index, bool value)
	{
		return WRAP_FMOD_DSP_SetParameterBool(rawPtr, index, value);
	}

	public RESULT setParameterData(int index, byte[] data)
	{
		return WRAP_FMOD_DSP_SetParameterData(rawPtr, index, Marshal.UnsafeAddrOfPinnedArrayElement(data, 0), (uint)data.Length);
	}

	public RESULT getParameterFloat(int index, out float value)
	{
		IntPtr zero = IntPtr.Zero;
		return WRAP_FMOD_DSP_GetParameterFloat(rawPtr, index, out value, zero, 0);
	}

	public RESULT getParameterInt(int index, out int value)
	{
		IntPtr zero = IntPtr.Zero;
		return WRAP_FMOD_DSP_GetParameterInt(rawPtr, index, out value, zero, 0);
	}

	public RESULT getParameterBool(int index, out bool value)
	{
		return WRAP_FMOD_DSP_GetParameterBool(rawPtr, index, out value, IntPtr.Zero, 0);
	}

	public RESULT getParameterData(int index, out IntPtr data, out uint length)
	{
		return WRAP_FMOD_DSP_GetParameterData(rawPtr, index, out data, out length, IntPtr.Zero, 0);
	}

	public RESULT getNumParameters(out int numparams)
	{
		return WRAP_FMOD_DSP_GetNumParameters(rawPtr, out numparams);
	}

	public RESULT getParameterInfo(int index, out DSP_PARAMETER_DESC desc)
	{
		IntPtr desc2;
		RESULT num = WRAP_FMOD_DSP_GetParameterInfo(rawPtr, index, out desc2);
		if (num == RESULT.OK)
		{
			desc = (DSP_PARAMETER_DESC)Marshal.PtrToStructure(desc2, typeof(DSP_PARAMETER_DESC));
			return num;
		}
		desc = default(DSP_PARAMETER_DESC);
		return num;
	}

	public RESULT getDataParameterIndex(int datatype, out int index)
	{
		return WRAP_FMOD_DSP_GetDataParameterIndex(rawPtr, datatype, out index);
	}

	public RESULT showConfigDialog(IntPtr hwnd, bool show)
	{
		return WRAP_FMOD_DSP_ShowConfigDialog(rawPtr, hwnd, show);
	}

	public RESULT getInfo(StringBuilder name, out uint version, out int channels, out int configwidth, out int configheight)
	{
		IntPtr intPtr = Marshal.AllocHGlobal(32);
		RESULT result = WRAP_FMOD_DSP_GetInfo(rawPtr, intPtr, out version, out channels, out configwidth, out configheight);
		StringMarshalHelper.NativeToBuilder(name, intPtr);
		Marshal.FreeHGlobal(intPtr);
		return result;
	}

	public RESULT getType(out DSP_TYPE type)
	{
		return WRAP_FMOD_DSP_GetType(rawPtr, out type);
	}

	public RESULT getIdle(out bool idle)
	{
		return WRAP_FMOD_DSP_GetIdle(rawPtr, out idle);
	}

	public RESULT setUserData(IntPtr userdata)
	{
		return WRAP_FMOD_DSP_SetUserData(rawPtr, userdata);
	}

	public RESULT getUserData(out IntPtr userdata)
	{
		return WRAP_FMOD_DSP_GetUserData(rawPtr, out userdata);
	}

	public RESULT setMeteringEnabled(bool inputEnabled, bool outputEnabled)
	{
		return WRAP_FMOD_DSP_SetMeteringEnabled(rawPtr, inputEnabled, outputEnabled);
	}

	public RESULT getMeteringEnabled(out bool inputEnabled, out bool outputEnabled)
	{
		return WRAP_FMOD_DSP_GetMeteringEnabled(rawPtr, out inputEnabled, out outputEnabled);
	}

	public RESULT getMeteringInfo(DSP_METERING_INFO inputInfo, DSP_METERING_INFO outputInfo)
	{
		return WRAP_FMOD_DSP_GetMeteringInfo(rawPtr, inputInfo, outputInfo);
	}

	public RESULT getCPUUsage(out uint exclusive, out uint inclusive)
	{
		return WRAP_FMOD_DSP_GetCPUUsage(rawPtr, out exclusive, out inclusive);
	}

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_Release(IntPtr dsp);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetSystemObject(IntPtr dsp, out IntPtr system);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_AddInput(IntPtr dsp, IntPtr target, out IntPtr connection, DSPCONNECTION_TYPE type);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_DisconnectFrom(IntPtr dsp, IntPtr target, IntPtr connection);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_DisconnectAll(IntPtr dsp, bool inputs, bool outputs);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetNumInputs(IntPtr dsp, out int numinputs);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetNumOutputs(IntPtr dsp, out int numoutputs);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetInput(IntPtr dsp, int index, out IntPtr input, out IntPtr inputconnection);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetOutput(IntPtr dsp, int index, out IntPtr output, out IntPtr outputconnection);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_SetActive(IntPtr dsp, bool active);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetActive(IntPtr dsp, out bool active);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_SetBypass(IntPtr dsp, bool bypass);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetBypass(IntPtr dsp, out bool bypass);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_SetWetDryMix(IntPtr dsp, float prewet, float postwet, float dry);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetWetDryMix(IntPtr dsp, out float prewet, out float postwet, out float dry);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_SetChannelFormat(IntPtr dsp, CHANNELMASK channelmask, int numchannels, SPEAKERMODE source_speakermode);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetChannelFormat(IntPtr dsp, out CHANNELMASK channelmask, out int numchannels, out SPEAKERMODE source_speakermode);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetOutputChannelFormat(IntPtr dsp, CHANNELMASK inmask, int inchannels, SPEAKERMODE inspeakermode, out CHANNELMASK outmask, out int outchannels, out SPEAKERMODE outspeakermode);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_Reset(IntPtr dsp);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_SetParameterFloat(IntPtr dsp, int index, float value);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_SetParameterInt(IntPtr dsp, int index, int value);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_SetParameterBool(IntPtr dsp, int index, bool value);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_SetParameterData(IntPtr dsp, int index, IntPtr data, uint length);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetParameterFloat(IntPtr dsp, int index, out float value, IntPtr valuestr, int valuestrlen);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetParameterInt(IntPtr dsp, int index, out int value, IntPtr valuestr, int valuestrlen);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetParameterBool(IntPtr dsp, int index, out bool value, IntPtr valuestr, int valuestrlen);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetParameterData(IntPtr dsp, int index, out IntPtr data, out uint length, IntPtr valuestr, int valuestrlen);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetNumParameters(IntPtr dsp, out int numparams);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetParameterInfo(IntPtr dsp, int index, out IntPtr desc);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetDataParameterIndex(IntPtr dsp, int datatype, out int index);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_ShowConfigDialog(IntPtr dsp, IntPtr hwnd, bool show);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetInfo(IntPtr dsp, IntPtr name, out uint version, out int channels, out int configwidth, out int configheight);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetType(IntPtr dsp, out DSP_TYPE type);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetIdle(IntPtr dsp, out bool idle);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_SetUserData(IntPtr dsp, IntPtr userdata);

	[DllImport("fmod")]
	private static extern RESULT WRAP_FMOD_DSP_GetUserData(IntPtr dsp, out IntPtr userdata);

	[DllImport("fmod")]
	public static extern RESULT WRAP_FMOD_DSP_SetMeteringEnabled(IntPtr dsp, bool inputEnabled, bool outputEnabled);

	[DllImport("fmod")]
	public static extern RESULT WRAP_FMOD_DSP_GetMeteringEnabled(IntPtr dsp, out bool inputEnabled, out bool outputEnabled);

	[DllImport("fmod")]
	public static extern RESULT WRAP_FMOD_DSP_GetMeteringInfo(IntPtr dsp, [Out] DSP_METERING_INFO inputInfo, [Out] DSP_METERING_INFO outputInfo);

	[DllImport("fmod")]
	public static extern RESULT WRAP_FMOD_DSP_GetCPUUsage(IntPtr dsp, out uint exclusive, out uint inclusive);

	public DSP(IntPtr raw)
		: base(raw)
	{
	}
}
