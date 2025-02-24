namespace Celeste.Mod
{
    public static class patch_Logger
    {
        public extern static patch_LogLevel orig_GetLogLevel(string tag);

        public static patch_LogLevel GetLogLevel(string tag)
        {
            if (tag == "loader" || tag == "relinker")
            {
                return patch_LogLevel.Verbose;
            }
            return orig_GetLogLevel(tag);
        }
    }

    public enum patch_LogLevel
    {
        Verbose,
        Debug,
        Info,
        Warn,
        Error
    }
}
