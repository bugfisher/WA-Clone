import { useRoute } from "@react-navigation/native";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { nanoid } from "nanoid";
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import GlobalContext from "../context/Context";
import { auth, db } from "../firebase";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import {
  Actions,
  Bubble,
  GiftedChat,
  InputToolbar,
} from "react-native-gifted-chat";
import { pickImage, uploadImage } from "../utils";
import ImageView from "react-native-image-viewing";
import Spinner from "react-native-loading-spinner-overlay";

const randomId = nanoid();

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: false,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

export default function Chat() {
  const {
    theme: { colors },
  } = useContext(GlobalContext);
  const [messages, setMessages] = useState([]);
  const [roomHash, setRoomHash] = useState("");
  const [notification, setNotification] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef();
  const responseListener = useRef();
  const { currentUser } = auth;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImageView, setSeletedImageView] = useState("");
  const [spinner, setSpinner] = useState(false);
  const route = useRoute();
  const room = route.params.room;
  const selectedImage = route.params.image;
  const userB = route.params.user;

  const senderUser = currentUser.photoURL
    ? {
        name: currentUser.displayName,
        _id: currentUser.uid,
        avatar: currentUser.photoURL,
      }
    : { name: currentUser.displayName, _id: currentUser.uid };

  const roomId = room ? room.id : randomId;
  const roomRef = doc(db, "rooms", roomId);
  const roomMessagesref = collection(db, "rooms", roomId, "messages");

  useEffect(() => {
    // This listener is fired whenever a notification is received while the app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });
    (async () => {
      if (!room) {
        const currentUserData = {
          displayName: currentUser.displayName,
          email: currentUser.email,
        };
        if (currentUser.photoURL) {
          currentUserData.photoURL = currentUser.photoURL;
        }
        const q = query(
          collection(db, "users"),
          where("email", "==", currentUser.email)
        );
        const unsubscribe = await onSnapshot(q, async (snapshot) => {
          if (snapshot.docs.length) {
            const userDoc = snapshot.docs[0].data();
            currentUserData.expoPushToken = userDoc.expoPushToken;
            const userBData = {
              displayName: userB.contactName || userB.displayName || "",
              email: userB.email,
            };
            if (userB.userDoc && userB.userDoc.photoURL) {
              userBData.photoURL = userB.userDoc.photoURL;
              userBData.expoPushToken = userB.userDoc.expoPushToken;
            }

            const roomData = {
              participants: [currentUserData, userBData],
              participantsArray: [currentUser.email, userB.email],
            };

            try {
              await setDoc(roomRef, roomData);
            } catch (error) {
              console.log(error);
            }
          }
        });
      }
      const emailHash = `${currentUser.email}:${userB.email}`;
      setRoomHash(emailHash);
      if (selectedImage && selectedImage.uri) {
        await sendImage(selectedImage.uri, emailHash);
      }
    })();
    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  const appendMessages = useCallback(
    (messages) => {
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, messages)
      );
    },
    [messages]
  );

  async function onSend(messages = []) {
    const writes = messages.map(async (m) => {
      await sendPushNotification(userB.expoPushToken, m);
      return addDoc(roomMessagesref, m);
    });
    const lastMessage = messages[messages.length - 1];
    writes.push(updateDoc(roomRef, { lastMessage }));
    await Promise.all(writes);
  }

  useEffect(() => {
    const unsubscribe = onSnapshot(roomMessagesref, (querySnapshot) => {
      const messagesFirestore = querySnapshot
        .docChanges()
        .filter(({ type }) => type === "added")
        .map(({ doc }) => {
          const message = doc.data();

          return { ...message, createdAt: message.createdAt.toDate() };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      appendMessages(messagesFirestore);
    });
    return () => unsubscribe();
  }, []);

  async function handlePhotoPicker() {
    const result = await pickImage();
    if (!result.cancelled) {
      await sendImage(result.uri);
    }
  }

  async function sendImage(uri, roomPath) {
    setSpinner(true);
    const { url, fileName } = await uploadImage(
      uri,
      `images/rooms/${roomPath || roomHash}`
    );

    const message = {
      _id: fileName,
      text: "",
      createdAt: new Date(),
      user: senderUser,
      image: url,
    };
    const lastMessage = { ...message, text: "Image" };

    await Promise.all([
      addDoc(roomMessagesref, message),
      updateDoc(roomRef, { lastMessage }),
    ]);
    setSpinner(false);
  }

  async function sendPushNotification(expoPushToken, Text) {
    //console.log("msg", Text);
    const message = {
      to: expoPushToken,
      sound: "default",
      title: Text.user.name,
      body: Text.text,
      data: {},
    };
    console.log("Sending", expoPushToken);
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
    console.log("Sent");
  }

  return (
    <ImageBackground
      resizeMode="cover"
      source={require("../assets/chatbg.png")}
      style={{ flex: 1 }}
    >
      <Spinner
        visible={spinner}
        textContent={"Sending Image..."}
        textStyle={styles.spinnerTextStyle}
      />
      <GiftedChat
        onSend={onSend}
        messages={messages}
        user={senderUser}
        renderAvatar={null}
        renderActions={(props) => (
          <Actions
            {...props}
            containerStyle={{
              position: "absolute",
              right: 50,
              bottom: 5,
              zIndex: 9999,
            }}
            onPressActionButton={handlePhotoPicker}
            icon={() => (
              <Ionicons name="camera" size={30} color={colors.iconGray} />
            )}
          />
        )}
        timeTextStyle={{ right: { color: colors.iconGray } }}
        renderSend={(props) => {
          const { text, messageIdGenerator, user, onSend } = props;
          return (
            <TouchableOpacity
              style={{
                height: 40,
                width: 40,
                borderRadius: 40,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 5,
              }}
              onPress={() => {
                if (text && onSend) {
                  onSend(
                    {
                      text: text.trim(),
                      user,
                      _id: messageIdGenerator(),
                    },
                    true
                  );
                }
              }}
            >
              <Ionicons name="send" size={20} color={colors.white} />
            </TouchableOpacity>
          );
        }}
        renderInputToolbar={(props) => (
          <InputToolbar
            {...props}
            containerStyle={{
              marginLeft: 10,
              marginRight: 10,
              marginBottom: 2,
              borderRadius: 20,
              paddingTop: 5,
            }}
          />
        )}
        renderBubble={(props) => (
          <Bubble
            {...props}
            textStyle={{ right: { color: colors.text } }}
            wrapperStyle={{
              left: {
                backgroundColor: colors.white,
              },
              right: {
                backgroundColor: colors.tertiary,
              },
            }}
          />
        )}
        renderMessageImage={(props) => {
          return (
            <View style={{ borderRadius: 15, padding: 2 }}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(true);
                  setSeletedImageView(props.currentMessage.image);
                }}
              >
                <Image
                  resizeMode="contain"
                  style={{
                    width: 200,
                    height: 200,
                    padding: 6,
                    borderRadius: 15,
                    resizeMode: "cover",
                  }}
                  source={{ uri: props.currentMessage.image }}
                />
                {selectedImageView ? (
                  <ImageView
                    imageIndex={0}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                    images={[{ uri: selectedImageView }]}
                  />
                ) : null}
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  spinnerTextStyle: {
    color: "#FFF",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10,
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5,
  },
});
