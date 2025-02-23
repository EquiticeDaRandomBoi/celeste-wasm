using System;
using System.Runtime.InteropServices;

namespace FMOD;
[UnmanagedFunctionPointer(CallingConvention.Cdecl)]
public delegate RESULT FILE_SEEKCALLBACK(IntPtr handle, uint pos, IntPtr userdata);
