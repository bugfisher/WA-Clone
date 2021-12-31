import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, View, LogBox } from "react-native";
import { useAssets } from "expo-asset";
import { onAuthStateChanged } from "@firebase/auth";
import { auth } from "./firebase";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import SignIn from "./screens/SignIn";
import ContextWrapper from "./context/ContextWrapper";
import Context from "./context/Context";
import Profile from "./screens/Profile";

LogBox.ignoreLogs([
  "Setting a Timer",
  "AsyncStorage has been extracted from react-native core and will be removed in a future release. It can now be installed and imported from '@react-native-async-storage/async-storage' instead of 'react-native'. See https://github.com/react-native-async-storage/async-storage",
]);

const Stack = createStackNavigator();

function App() {
  const [currUser, setCurrUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const {
    theme: { colors },
  } = useContext(Context);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(false);
      if (user) {
        setCurrUser(user);
      }
    });

    return () => unsubscribe;
  }, []);

  if (loading && currUser) {
    return <Text>Loading....</Text>;
  }

  return (
    <NavigationContainer>
      {!currUser ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="signIn" component={SignIn} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.foreground,
              shadowOpacity: 0,
              elevation: 0,
            },
            headerTintColor: colors.white,
          }}
        >
          {!currUser.displayName && (
            <Stack.Screen
              name="Profile"
              component={Profile}
              options={{ headerShown: false }}
            />
          )}
          <Stack.Screen
            name="Home"
            options={{ title: "WhatsApp" }}
            component={Home}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

function Home() {
  return <Text>I have a Profile</Text>;
}

export default function Main() {
  const [assets] = useAssets(
    require("./assets/icon-square.png"),
    require("./assets/chatbg.png"),
    require("./assets/user-icon.png"),
    require("./assets/welcome-img.png")
  );

  if (!assets) {
    return <Text>Loading!....</Text>;
  }

  return (
    <ContextWrapper>
      <App />
    </ContextWrapper>
  );
}
