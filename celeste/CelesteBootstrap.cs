using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Runtime.InteropServices;
using System.Runtime.InteropServices.JavaScript;
using System.IO;
using System.Linq;

struct Dll
{
    public string RealName;
    public string MappedName;
}

public static partial class CelesteBootstrap
{
    [DllImport("Emscripten")]
    public extern static int mount_opfs();
    [DllImport("Emscripten")]
    public extern static int mount_fetch(string src, string dst);

    [JSExport]
    public static async Task MountFilesystems(string[] rawDlls)
    {
        int ret = mount_opfs();
        Console.WriteLine($"called mount_opfs: {ret}");
        if (ret != 0)
        {
            throw new Exception("Failed to mount OPFS");
        }

        File.CreateSymbolicLink("/Content", "/libsdl/Content");

        if (!Directory.Exists("/libsdl/Celeste/Everest"))
            Directory.CreateDirectory("/libsdl/Celeste/Everest");
        if (!Directory.Exists("/libsdl/Celeste/Mods"))
            Directory.CreateDirectory("/libsdl/Celeste/Mods");

        IEnumerable<Dll> dlls = rawDlls.Select(x =>
        {
            var split = x.Split('|');
            return new Dll() { RealName = split[0], MappedName = split[1] };
        });

        // mono.cecil searches in /bin for some dlls
        Directory.CreateDirectory("/bin");
        Parallel.ForEach(dlls, (dll) =>
        {
            Console.WriteLine($"Mounting {dll.RealName}");
            int fetchret = mount_fetch($"/_framework/{dll.RealName}", $"/bin/{dll.MappedName}");
            if (ret != 0)
            {
                throw new Exception($"Failed to mount {dll.MappedName}");
            }
        });

        File.CreateSymbolicLink("/bin/Celeste.exe", "/libsdl/CustomCeleste.dll");
        File.CreateSymbolicLink("/bin/Celeste.dll", "/libsdl/CustomCeleste.dll");
        Console.WriteLine("created symlinks");
    }
}
