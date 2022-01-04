import React from "react";
import { View, Text, Image } from "react-native";

export default function Avatar({ size, user }) {

  return (
    <Image
      style={{ width: size, height: size, borderRadius: size }}
      source={
        user.photoURL
          ? { uri: user.photoURL }
          : require("../assets/icon-square.png")
      }
      resizeMode="cover"
    />
  );
}
