import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
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
          tabBarIcon: ({ color }) => (
            <IconSymbol name="house.fill" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="grupos"
        options={{
          title: "Radar",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="radar" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Estatísticas",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="chart.bar.fill" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="marcilio"
        options={{
          title: "Elenco",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="people.fill" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Configurações",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="gearshape.fill" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
