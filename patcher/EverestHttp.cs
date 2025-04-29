using System;
using System.Net.Http;
using MonoMod;

[MonoModLinkFrom("Celeste.Mod.Helpers.CompressedHttpClient")]
public class RegularHttpClient : HttpClient
{
    public RegularHttpClient() : base()
    {
        DefaultRequestHeaders.Add("User-Agent", $"Everest/{Celeste.Mod.patch_Everest.VersionString}");
    }
}


namespace Celeste.Mod
{
    public static partial class patch_Everest
    {
        [MonoModIgnore]
        public readonly static String VersionString;
    }
}
