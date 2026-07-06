import { Tabs } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { valgaronColors } from '@valgaron/ui-tokens';
import { mobileTabRoutes } from '../../src/navigation/mobileRoutes';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="entries"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: valgaronColors.accent,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: valgaronColors.muted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: valgaronColors.surface,
          borderTopColor: valgaronColors.border,
        },
      }}
    >
      {mobileTabRoutes.map((route) => (
        <Tabs.Screen
          key={route.id}
          name={route.screenName}
          options={{
            title: route.title,
            tabBarAccessibilityLabel: route.tabAccessibilityLabel,
            tabBarButtonTestID: `tab.${route.id}`,
            tabBarLabel: route.tabLabel,
            tabBarIcon: ({ color, size }) => (
              <Feather name={route.iconName} color={color} size={size} />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="workspaces" options={{ href: null }} />
      <Tabs.Screen name="data" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
    </Tabs>
  );
}
