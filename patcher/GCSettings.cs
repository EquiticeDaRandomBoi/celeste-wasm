using System.Runtime;

namespace MonoMod
{
    [MonoModLinkFrom("System.Runtime.GCSettings")]
    public static class GCSettings
    {
        public static GCLatencyMode LatencyMode { get { return GCLatencyMode.SustainedLowLatency; } set { } }
    }
}
