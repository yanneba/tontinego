import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { COLORS } from '@/constants/theme';

const TAB_ICONS: Record<string, { focused: string; idle: string }> = {
  index: { focused: '🏠', idle: '🏠' },
  tontines: { focused: '🪙', idle: '🪙' },
  profile: { focused: '👤', idle: '👤' },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 84,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>
              {focused ? TAB_ICONS.index.focused : TAB_ICONS.idle.focused}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="tontines"
        options={{
          title: 'Tontines',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>
              {focused ? TAB_ICONS.tontines.focused : TAB_ICONS.idle.focused}
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.55 }}>
              {focused ? TAB_ICONS.profile.focused : TAB_ICONS.idle.focused}
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}
