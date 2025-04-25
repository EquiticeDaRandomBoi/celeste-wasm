import { Switch } from "./ui"
import { store } from "./store";

export const Settings: Component<{}, {
  darkMode: boolean,
  showLogs: boolean
}> = function() {
  this.css = `
  display: flex;
  overflow-x: hidden;
  overflow-y: auto;
  flex-direction: column;
  gap: 0.8rem;

  .component-switch {
    margin-inline: 0.25rem;
  }
  `;

  this.darkMode = store.theme === "dark";
  useChange([this.darkMode], () => {
    console.log("Theme changed");
    store.theme = this.darkMode ? "dark" : "light";
  });

  this.showLogs = store.logs > 0;
  useChange([this.showLogs], () => {
    console.log("Logs changed");
    store.logs = this.showLogs ? 1 : -1;
  });

  return (
    <div>
      <Switch title="Dark Mode" bind:on={use(this.darkMode)} />
      <Switch title="Show Logs" bind:on={use(this.showLogs)} />
      <div>
        <div style="margin-inline: 0.2rem; user-select: none;">Accent Color</div>
        <AccentPicker />
      </div>
    </div>
  )
}


const AccentPicker: Component<{}> = function() {
  this.css = `
    display: flex;
    flex-wrap: nowrap;
    max-width: 100%;
    justify-content: space-between;
    align-items: center;
    margin-inline: 0.2rem;
    padding-block: 10px;
    padding-inline: calc(0.25rem + 5.25px);
    margin-top: 0.2rem;

    button {
      border: none;
      appearance: none;
      cursor: pointer;
      background-color: var(--accent);
      height: 2.2rem;
      width: 2.2rem;
      font-size: 1.35rem;
      font-family: var(--font-display);
      color: var(--bg);
      border-radius: 50%;
      outline: 2px solid var(--accent);
      outline-offset: -0.5px;
      transition: outline-width 0.25s ease, outline-offset 0.2s ease;
    }

    button:not(:has(.selected)):hover {
      outline-width: 5.25px;
    }

    button:has(.selected) {
      transition: outline-width 0.25s ease, outline-offset 0.2s ease;
      outline-offset: 2.75px;
    }

    .selected {
      user-select: none;
      -webkit-user-select: none;
    }
  `

  const options = [undefined, "orange", "yellow", "green", "blue", "purple"];
  return (
    <div>
      {options.map(option => (
        <button
          key={option}
          // @ts-ignore i hate you typescript
          on:click={() => store.accentColor = option}
          class={use`${store.theme} ${option}`}
          // @ts-ignore is there really no way to ignore a whole scope
          title={(option?.charAt(0).toUpperCase() + option?.slice(1))||"Red"}
        >
          {$if(use(store.accentColor, c=>c==option), <div class="selected">✓</div>)}
        </button>
      ))}
    </div>
  )
}
