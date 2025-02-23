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
		public static extern LogLevel orig_GetLogLevel(string tag);
        public static LogLevel GetLogLevel(string tag)
        {
            return LogLevel.Verbose;
        }
    }
}
