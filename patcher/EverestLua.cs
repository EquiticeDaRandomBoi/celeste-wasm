using System;

namespace Celeste.Mod
{
    public static partial class Everest
    {
        public static partial class patch_LuaLoader
        {
            internal static void Initialize()
            {
                Console.WriteLine("Everest Lua disabled");
            }
        }
    }
}
