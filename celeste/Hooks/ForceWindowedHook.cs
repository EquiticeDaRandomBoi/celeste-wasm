using MonoMod.RuntimeDetour;
using System.Reflection;
using System;
using Microsoft.Xna.Framework;

public class ForceWindowedHook
{
    private Hook Hook;
    private PropertyInfo Graphics;

    private void Hooker(Action<object> orig, object self)
    {
        Console.WriteLine("Forcing windowed");
        orig(self);

        GraphicsDeviceManager graphics = (GraphicsDeviceManager)Graphics.GetValue(null);
        if (graphics == null) throw new Exception("Failed to get GraphicsDeviceManager");

        graphics.PreferredBackBufferWidth = 1920;
        graphics.PreferredBackBufferHeight = 1080;
        graphics.IsFullScreen = false;
        graphics.ApplyChanges();

        Console.WriteLine("Forced windowed");
    }

    public ForceWindowedHook(Assembly celeste)
    {
        var Settings = celeste.GetType("Celeste.Settings");
        var Engine = celeste.GetType("Monocle.Engine");
        Graphics = Engine.GetProperty("Graphics", BindingFlags.Public | BindingFlags.Static);
        Console.WriteLine($"GRAPHICS: {Graphics}");

        Hook = new(Settings.GetMethod("ApplyScreen"), Hooker);
    }
}
