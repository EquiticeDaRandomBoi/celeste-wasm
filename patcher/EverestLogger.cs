namespace Celeste.Mod
{
    public enum LogLevel
    {
        Verbose,
        Debug,
        Info,
        Warn,
        Error
    }

    public static class patch_Logger
    {
        public static LogLevel GetLogLevel(string tag)
        {
            return LogLevel.Verbose;
        }
    }
}
