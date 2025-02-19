using System.Net;

namespace MonoMod
{
    public class ServicePointManager
    {
		[MonoModLinkFrom("System.Net.SecurityProtocolType System.Net.ServicePointManager::get_SecurityProtocol()")]
        public SecurityProtocolType get_SecurityProtocol()
        {
            return SecurityProtocolType.SystemDefault;
        }
		[MonoModLinkFrom("System.Void System.Net.ServicePointManager::set_SecurityProtocol(System.Net.SecurityProtocolType)")]
        public void set_SecurityProtocol(SecurityProtocolType type) { }
    }
}
