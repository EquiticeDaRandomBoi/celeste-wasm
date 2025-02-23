using System;
using System.Runtime.InteropServices;

namespace FMOD;
[UnmanagedFunctionPointer(CallingConvention.Cdecl)]
public delegate RESULT FILE_OPENCALLBACK(StringWrapper name, IntPtr filesize, IntPtr handle, IntPtr userdata);
