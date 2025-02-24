using System;
using Microsoft.Xna.Framework;

namespace Monocle
{
    class Engine
    {
        public static GraphicsDeviceManager Graphics { get; private set; }
    }
}

namespace Celeste
{
    public class patch_Settings
    {
        public int WindowScale;
        public bool Fullscreen;

        public extern void orig_ApplyScreen();
        public void ApplyScreen()
        {
            Console.WriteLine("Forcing windowed");
            orig_ApplyScreen();

            Monocle.Engine.Graphics.PreferredBackBufferWidth = WindowScale * 320;
            Monocle.Engine.Graphics.PreferredBackBufferHeight = WindowScale * 180;
            Monocle.Engine.Graphics.IsFullScreen = false;
            Monocle.Engine.Graphics.ApplyChanges();
            Fullscreen = false;

            Console.WriteLine("Forced windowed");
        }
    }
}
