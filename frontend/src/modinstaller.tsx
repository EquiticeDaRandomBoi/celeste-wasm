import { loadedLibcurlPromise } from "./game/index";
import { TextField } from "./ui/TextField";
import { Button, Icon } from "./ui/Button";
import { rootFolder } from "./fs";
import { epoxyFetch } from "./epoxy";
import iconSearch from "@ktibow/iconset-material-symbols/search";
import iconDownload from "@ktibow/iconset-material-symbols/download";

type Mod = {
  Screenshots: string[],
  PageURL: string,
  Name: string,
  Text: string,
  Files: {
    URL: string,
    Name: string,
  }[]
};

export const ModInstaller: Component<
  {
    open: boolean;
  },
  {
    entries: Mod[];
    query: string;
  }
> = function() {
  // https://maddie480.ovh/celeste/gamebanana-categories
  // https://maddie480.ovh/celeste/gamebanana-subcategories?itemtype=...&categoryId=...

  this.query = "";
  this.entries = [];
  this.css = `
  height: 100%;

  .mods {
    img {
      width: 100px;
      height: 100px;
      border: 0;
    }
  }

  .mod {
    display: flex;
    flex-direction: row;
    align-items: start;
    position: relative;
  }

  .bg {
    z-index: 9000;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
    filter: brightness(0.8) contrast (0.6);
    object-fit: cover;
  }

  .mod,
  .detail {
    z-index: 9002;
  }

  .moddownload {
    margin-top: 0.83rem;
  }

  #modsearch {
    display: flex;
    gap: 0.5rem;
  }

  .modsearchbar {
    flex-grow: 1;
  }
	`;

  const loadFrom = async (url: string) => {
    await loadedLibcurlPromise;
    let res = await fetch(url);
    this.entries = [];

    let entries: Mod[] = await res.json();
    this.entries = entries.map(ent => {
      let e = $state(ent);
      for (let i = 0; i < e.Screenshots.length; i++) {
        let url = e.Screenshots[i];
        e.Screenshots[i] = "";
        epoxyFetch(url).then(b => b.blob()).then(blob => {
          let url = URL.createObjectURL(blob);
          e.Screenshots[i] = url;
          e.Screenshots = e.Screenshots;
        });
      }

      return e;
    });

  };

  const search = async () => {
    await loadFrom("https://maddie480.ovh/celeste/gamebanana-search?q=" + this.query);
    this.query = "";
  }

  const download = async (mod: Mod) => {
    let celeste = await rootFolder.getDirectoryHandle("Celeste", { create: true });
    let mods = await celeste.getDirectoryHandle("Mods", { create: true });

    try {
      await mods.getFileHandle(mod.Files[0].Name, { create: false });
      alert("Mod already installed");
      return;
    } catch (e) { }

    let resp = await epoxyFetch(mod.Files[0].URL);
    let modfile = await mods.getFileHandle(mod.Files[0].Name, { create: true });
    let writable = await modfile.createWritable();
	// @ts-expect-error
    await resp.body.pipeTo(writable);

    console.log("Downloaded mod");
  }

  this.mount = async () => {
    //loadFrom("https://maddie480.ovh/celeste/gamebanana-featured");
  };


  return (
    <div>
      <div id="modsearch">
        <TextField placeholder={"Search"} on:keydown={(e: any) => e.key === "Enter" && search()} bind:value={use(this.query)} class={"modsearchbar"} />
        <Button on:click={search} class={"searchbtn"} type={"primary"} icon={"full"} disabled={false}>
          <Icon icon={iconSearch} />
        </Button>
      </div>
      <div class="mods">
        {use(this.entries, e => e.map(e =>
          <div class="mod">
            <img alt="Screenshot" class="bg" src={e.Screenshots[0] || ""} />
            <div class="detail">
            <h2>{e.Name}</h2>
            {(() => {
              let p = <p />;
              p.innerHTML = e.Text;
              return p;
            })()}
            {/* {use(e.Screenshots, e => e.map(s => <img src={s} />))} */}
            </div>
            <Button on:click={() => {
              download(e);
            }} icon="full" type="primary" class="moddownload" disabled={false} title={"Download Mod"}>
              <Icon icon={iconDownload} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
