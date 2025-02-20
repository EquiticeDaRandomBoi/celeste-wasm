using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Runtime.InteropServices.JavaScript;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using SteamKit2;
using SteamKit2.CDN;
using System.Collections.Generic;
using System.Linq;
using QRCoder;
using DepotDownloader;

partial class JS
{
    [JSImport("newqr", "depot.js")]
    public static partial void newqr(string dataurl);
}

public static partial class Steam
{

    [JSExport]
    internal static async Task<bool> Init()
    {

        AccountSettingsStore.LoadFromFile("/libsdl/account.config");
        ContentDownloader.Config.RememberPassword = true;
        // ContentDownloader.Config.DownloadManifestOnly = true;


        ContentDownloader.Config.CellID = 0;
        ContentDownloader.Config.UsingFileList = true;
        ContentDownloader.Config.FilesToDownload = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        ContentDownloader.Config.FilesToDownloadRegex = [
            new Regex("Content\\/.*", RegexOptions.Compiled | RegexOptions.IgnoreCase),
        ];
        ContentDownloader.Config.FilesToDownload.Add("Celeste.exe");

        ContentDownloader.Config.InstallDirectory = "/libsdl/";

        ContentDownloader.Config.VerifyAll = false;
        ContentDownloader.Config.MaxServers = 20;


        ContentDownloader.Config.MaxDownloads = 8;
        ContentDownloader.Config.MaxServers = 8;
        ContentDownloader.Config.LoginID = null;

        return true;
    }
    [JSExport]
    internal static async Task<bool> InitSteamSaved()
    {
        try
        {
            if (AccountSettingsStore.Instance.LoginTokens.Keys.Count > 0)
            {
                string username = AccountSettingsStore.Instance.LoginTokens.Keys.First();
                if (String.IsNullOrEmpty(username)) return false;

                Console.WriteLine("Using saved login token for " + username);

                if (ContentDownloader.InitializeSteam3(username, null))
                {
                    return true;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
            return false;
        }
        return false;
    }

    [JSExport]
    internal static async Task<bool> DownloadSteamCloud()
    {
        return await ContentDownloader.steam3.DownloadSteamCloud(504230, 100, "/libsdl/remote/");
    }

    [JSExport]
    internal static async Task<bool> InitSteam(string username, string password, bool qr)
    {
        try
        {
            ContentDownloader.Config.UseQrCode = qr;
            Steam3Session.qrCallback = (QRCodeData q) =>
            {
                Console.WriteLine("Got QR code data");
                PngByteQRCode png = new PngByteQRCode(q);
                byte[] bytes = png.GetGraphic(20);
                string dataurl = "data:image/png;base64," + Convert.ToBase64String(bytes);
                JS.newqr(dataurl);
            };

            if (ContentDownloader.InitializeSteam3(username, password))
            {
                return true;
            }
            else
            {
                Console.WriteLine("Error: InitializeSteam failed");
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
        }


        return false;
    }

    [JSExport]
    internal static async Task<bool> DownloadApp()
    {
        var depotManifestIds = new List<(uint, ulong)>();
        depotManifestIds.Add((504233, 5880027853585448535));

        try
        {
            await ContentDownloader.DownloadAppAsync(504230, depotManifestIds, "public", null, null, null, false, false).ConfigureAwait(false);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine("Could not download app: " + ex.Message);
            return false;
        }
    }
}
