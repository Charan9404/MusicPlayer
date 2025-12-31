import React from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Home from "./src/screens/Home";
import Player from "./src/screens/Player";
import Queue from "./src/screens/Queue";
import Album from "./src/screens/Album";

import MiniPlayer from "./src/components/MiniPlayer";

import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import { navigationRef, RootStackParamList } from "./src/navigation/nav";

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppInner() {
  const { theme } = useTheme();
  const [routeName, setRouteName] = React.useState<string>("Home");

  const onNavChange = () => {
    const r = navigationRef.getCurrentRoute();
    setRouteName(r?.name ?? "Home");
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <NavigationContainer ref={navigationRef} onReady={onNavChange} onStateChange={onNavChange}>
        {/* ✅ ONLY Screens here */}
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Player" component={Player} />
          <Stack.Screen name="Queue" component={Queue} />
          <Stack.Screen name="Album" component={Album} />
        </Stack.Navigator>

        {/* ✅ Outside Navigator, but inside NavigationContainer */}
        {routeName !== "Player" ? <MiniPlayer /> : null}
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
