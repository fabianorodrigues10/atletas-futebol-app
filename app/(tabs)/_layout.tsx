import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Atletas",
        }}
      />
      <Tabs.Screen
        name="grupos"
        options={{
          title: "Radar",
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Estatísticas",
        }}
      />
      <Tabs.Screen
        name="marcilio"
        options={{
          title: "Elenco",
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Configurações",
        }}
      />
    </Tabs>
  );
}
