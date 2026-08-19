import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";

const linking = {
  prefixes: [
    "daze://",
    "https://daze.jayagarwal.online",
    "https://*.daze.jayagarwal.online",
  ],
  config: {
    screens: {
      "(tabs)": {
        screens: {
          index: "",
          search: "search",
          library: "library",
          downloads: "downloads",
        },
      },
      "song/[id]": "song/:id",
      "album/[id]": "album/:id",
      "artist/[id]": "artist/:id",
      "playlist/[id]": "playlist/:id",
      history: "history",
    },
  },
};

function App() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} linking={linking} />;
}

registerRootComponent(App);
