namespace Celeste.Mod
{
    public static class patch_Logger
    {
        public extern static LogLevel orig_GetLogLevel(string tag);

        public static LogLevel GetLogLevel(string tag)
        {
            if (tag == "loader" || tag == "relinker")
            {
                return LogLevel.Verbose;
            }
            return orig_GetLogLevel(tag);
        }
    }

    public enum LogLevel 
    {
        Verbose,
        Debug,
        Info,
        Warn,
        Error
    }
}
