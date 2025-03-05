import { loadedLibcurlPromise } from "./game/index";
import { Button } from "./ui";
import { rootFolder } from "./fs";
import { epoxyFetch } from "./epoxy";

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
    }
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
      <div>
        <input type="text" placeholder="Search" bind:value={use(this.query)} on:keydown={(e: any) => e.key === "Enter" && search()} />
        <button on:click={search}>Search</button>
      </div>
      <div class="mods">
        {use(this.entries, e => e.map(e =>
          <div class="mod">
            <h2>{e.Name}</h2>
            {(() => {
              let p = <p />;
              p.innerHTML = e.Text;
              return p;
            })()}
            {use(e.Screenshots, e => e.map(s => <img src={s} />))}
            <Button on:click={() => {
              download(e);
            }} icon="full" type="normal" disabled={false}>
              download
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
