namespace SDL2 {
	class SDL {
		public static string SDL_GetPlatform() {
			// trick celeste into loading stuff later
			return "Stadia";
		}
		public static string SDL_GetPrefPath(string org, string app) {
			return SDL3.SDL.SDL_GetPrefPath(org, app);
		}
	}
}
