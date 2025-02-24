SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "$SCRIPT_DIR" || exit 1

ROOT="$(realpath nuget/microsoft.netcore.app.runtime.mono.multithread.browser-wasm/9.?.?/)"

rm -r "${ROOT:?}"/runtimes/browser-wasm/{lib,native}
unzip -q -o statics/dotnet.zip -d "${ROOT:?}"/
