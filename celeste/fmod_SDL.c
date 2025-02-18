void FMOD_SDL_Register(void *system) {}

int WRAP_FMOD_Studio_System_SetListenerAttributes(void *system, int index, void *attributes, void *attenuationposition);
int WRAP_FMOD_Studio_System_SetListenerAttributes_2(void *system, int index, void *attributes) {
	return WRAP_FMOD_Studio_System_SetListenerAttributes(system, index, attributes, (void*)0);
}
