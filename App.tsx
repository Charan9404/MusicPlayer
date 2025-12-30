import React from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Home from "./src/screens/Home";
import Player from "./src/screens/Player";
import Queue from "./src/screens/Queue";
import MiniPlayer from "./src/components/MiniPlayer";

import { audio } from "./src/player/audio";
import { usePlayerStore } from "./src/store/playerStore";
import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";


type RootStackParamList = {
  Home: undefined;
  Player: undefined;
  Queue: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navRef = createNavigationContainerRef<RootStackParamList>();

function AppInner() {
  const hydrate = usePlayerStore((s) => s.hydrate);
  const isHydrated = usePlayerStore((s) => s.isHydrated);
  const { theme } = useTheme();

  const [routeName, setRouteName] = React.useState<string>("Home");

  React.useEffect(() => {
    audio.initAudioMode();
    hydrate();
  }, []);

  const showMini = isHydrated && routeName !== "Player";

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <NavigationContainer
        ref={navRef}
        onReady={() => setRouteName(navRef.getCurrentRoute()?.name ?? "Home")}
        onStateChange={() => setRouteName(navRef.getCurrentRoute()?.name ?? "Home")}
      >
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Player" component={Player} />
          <Stack.Screen name="Queue" component={Queue} />
        </Stack.Navigator>

        {showMini ? <MiniPlayer /> : null}
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
