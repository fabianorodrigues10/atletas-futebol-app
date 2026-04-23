import { Image } from "react-native";

type TabIconName = "atletas" | "radar" | "stats" | "elenco" | "settings";

const ICON_MAP: Record<TabIconName, any> = {
  atletas: require("@/assets/images/icon-atletas.png"),
  radar: require("@/assets/images/icon-radar.png"),
  stats: require("@/assets/images/icon-stats.png"),
  elenco: require("@/assets/images/icon-elenco.png"),
  settings: require("@/assets/images/icon-settings.png"),
};

export function IconTabs({
  name,
  size = 24,
  color,
}: {
  name: TabIconName;
  size?: number;
  color: string;
}) {
  return (
    <Image
      source={ICON_MAP[name]}
      style={{
        width: size,
        height: size,
        tintColor: color,
      }}
    />
  );
}
