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

    private static void TryCreateDirectory(string path)
    {
        if (!Directory.Exists(path))
            Directory.CreateDirectory(path);
    }

    private static void MountDlls(string[] rawDlls)
    {
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
            int ret = mount_fetch($"/_framework/{dll.RealName}", $"/bin/{dll.MappedName}");
            if (ret != 0)
            {
                throw new Exception($"Failed to mount {dll.MappedName}: error code {ret}");
            }
        });
    }

    [JSExport]
    public static async Task MountFilesystems(string[] rawDlls)
    {
        try
        {
            int ret = mount_opfs();
            Console.WriteLine($"called mount_opfs: {ret}");
            if (ret != 0)
            {
                throw new Exception($"Failed to mount OPFS: error code {ret}");
            }

            TryCreateDirectory("/libsdl/Celeste/Everest");
            TryCreateDirectory("/libsdl/Celeste/Mods");
            TryCreateDirectory("/libsdl/Celeste/Saves");
            File.CreateSymbolicLink("/Content", "/libsdl/Content");
            File.CreateSymbolicLink("/Saves", "/libsdl/Celeste/Saves");
            Console.WriteLine("created symlinks");

            MountDlls(rawDlls);
            Console.WriteLine("mounted dlls");
        }
        catch (Exception err)
        {
            Console.WriteLine(err);
        }
    }
}
