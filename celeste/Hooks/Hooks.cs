using System.Reflection;

public class Hooks
{
    public static BloomHook Bloom;
    public static ForceWindowedHook Windowed;
    public static CreditsHook Credits;

    public static void Initialize(Assembly celeste)
    {
        Bloom = new(celeste);
        Windowed = new(celeste);
        Credits = new(celeste);
    }
}
