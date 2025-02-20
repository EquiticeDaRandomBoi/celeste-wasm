using System.Reflection;

public class Hooks
{
    public static BloomHook Bloom;

    public static void Initialize(Assembly celeste)
    {
        Bloom = new(celeste);
    }
}
