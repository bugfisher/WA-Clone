import { StatusBar } from "expo-status-bar";
import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Button,
  Image,
} from "react-native";
import Constants from "expo-constants";
import GlobalContext from "../context/Context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { pickImage, askForPermission } from "../utils";

export default function Profile() {
  const {
    theme: { colors },
  } = useContext(GlobalContext);

  const [displayName, setDisplayName] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const [permissionStatus, setPermissionStatus] = useState(null);

  function handlePress() {}

  useEffect(() => {
    (async () => {
      const status = await askForPermission();
      setPermissionStatus(status);
    })();
  }, []);

  async function handleProfilePicture() {
    const result = await pickImage();
    if (!result.cancelled) {
      setSelectedImage(result.uri);
    }
  }
  if (!permissionStatus) {
    return <Text>Loading...!</Text>;
  }
  if (permissionStatus !== "granted") {
    return <Text>Requested Permission required!</Text>;
  }
  return (
    <React.Fragment>
      <StatusBar style="auto" />
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          paddingTop: Constants.statusBarHeight + 20,
          padding: 20,
        }}
      >
        <Text style={{ fontSize: 22, color: colors.foreground }}>
          Profile Info
        </Text>
        <Text style={{ fontSize: 14, color: colors.text, marginTop: 20 }}>
          Please provide your name and an optional profile photo
        </Text>
        <TouchableOpacity
          onPress={handleProfilePicture}
          style={{
            marginTop: 30,
            borderRadius: 120,
            width: 120,
            height: 120,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!selectedImage ? (
            <MaterialCommunityIcons
              name="camera-plus"
              color={colors.iconGray}
              size={45}
            />
          ) : (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: "100%", height: "100%", borderRadius: 120 }}
            />
          )}
        </TouchableOpacity>
        <TextInput
          placeholder="Type your name"
          value={displayName}
          onChangeText={setDisplayName}
          style={{
            borderBottomColor: colors.primary,
            marginTop: 20,
            borderBottomWidth: 2,
            width: "100%",
          }}
        />

        <View style={{ marginTop: "auto", width: 80 }}>
          <Button
            title="Next"
            color={colors.secondary}
            onPress={handlePress}
            disabled={!displayName}
          />
        </View>
      </View>
    </React.Fragment>
  );
}
