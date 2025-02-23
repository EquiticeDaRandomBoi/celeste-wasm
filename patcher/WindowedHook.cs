using System;
using Microsoft.Xna.Framework;

namespace Monocle {
	class Engine {
		public static GraphicsDeviceManager Graphics { get; private set; }
	}
}

namespace Celeste
{
    public class patch_Settings
    {
        public extern void orig_ApplyScreen();
        public void ApplyScreen()
        {
            Console.WriteLine("Forcing windowed");
            orig_ApplyScreen();

            Monocle.Engine.Graphics.PreferredBackBufferWidth = 1920;
            Monocle.Engine.Graphics.PreferredBackBufferHeight = 1080;
            Monocle.Engine.Graphics.IsFullScreen = false;
            Monocle.Engine.Graphics.ApplyChanges();

            Console.WriteLine("Forced windowed");
        }
    }
}
