namespace MonoMod
{
    [MonoModLinkFrom("System.Diagnostics.Process")]
    public class WasmProcess
    {
		public static WasmProcess GetCurrentProcess () {
			return new WasmProcess();
		}

		public long WorkingSet64 { get { return long.MaxValue; } }
    }
}
