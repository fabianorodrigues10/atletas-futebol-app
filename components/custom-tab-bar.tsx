import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";

// Font stack que garante suporte a emojis na web
const EMOJI_FONT_STACK = Platform.select({
  web: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",system-ui,sans-serif',
  default: undefined,
});

// Mapeamento de nomes de rota para emojis
const ROUTE_EMOJIS: Record<string, string> = {
  index: "🏠",
  grupos: "📡",
  stats: "📊",
  marcilio: "👥",
  settings: "⚙️",
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title || route.name;
        const isFocused = state.index === index;
        const emoji = ROUTE_EMOJIS[route.name] || "📌";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[
              styles.tab,
              {
                borderTopColor: isFocused ? colors.tint : "transparent",
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.emoji,
                {
                  color: isFocused ? colors.tint : colors.muted,
                  fontFamily: EMOJI_FONT_STACK,
                },
              ]}
            >
              {emoji}
            </Text>
            <Text
              style={[
                styles.label,
                {
                  color: isFocused ? colors.tint : colors.muted,
                  fontSize: 12,
                },
              ]}
              numberOfLines={1}
            >
              {label.replace(/^[🏠📡📊👥⚙️]\s+/, "")}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderTopWidth: 3,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontWeight: "500",
  },
});
