import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useContext, useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import GlobalContext from "../context/Context";
import { db } from "../firebase";
import useContacts from "../hooks/useHooks";
import ListItems from "../components/ListItems";
import { useRoute } from "@react-navigation/native";

export default function Contacts() {
  const contacts = useContacts();
  const route = useRoute();
  const image = route.params && route.params.image;

  return (
    <FlatList
      style={{ flex: 1, padding: 10 }}
      data={contacts}
      keyExtractor={(_, i) => i}
      renderItem={({ item }) => <ContactPreview contact={item} image={image} />}
    />
  );
}

function ContactPreview({ contact, image }) {
  const { rooms, unfilteredRooms } = useContext(GlobalContext);
  const [user, setUser] = useState(contact);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("email", "==", contact.email)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.docs.length) {
        const userDoc = snapshot.docs[0].data();
        setUser((prevUser) => ({
          ...prevUser,
          userDoc,
          photoURL: userDoc.photoURL,
          expoPushToken: userDoc.expoPushToken,
        }));
      }
    });
    return () => unsubscribe();
  }, []);
  return (
    <ListItems
      style={{ marginTop: 7 }}
      type="contacts"
      user={user}
      image={image}
      room={unfilteredRooms.find((room) =>
        room.participantsArray.includes(contact.email)
      )}
    />
  );
}
