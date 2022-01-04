import { useRoute } from "@react-navigation/native";
import React, { useContext } from "react";
import { View, Text } from "react-native";
import GlobalContext from "../context/Context";
import Avatar from "./Avatar";

export default function ChatHeader() {
  const route = useRoute();
  const {
    theme: { colors },
  } = useContext(GlobalContext);
  return (
    <View style={{ flexDirection: "row" }}>
      <View>
        <Avatar size={40} user={route.params.user} />
      </View>
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 15,
        }}
      >
        <Text style={{ color: colors.white, fontSize: 18 }}>
          {route.params.user.contactName || route.params.user.displayName}
        </Text>
      </View>
    </View>
  );
}
