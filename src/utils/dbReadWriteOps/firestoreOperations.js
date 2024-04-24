// Relative path: src/utils/dbReadWriteOps/firestoreOperations.js
import { getFirestore, collection, addDoc } from "firebase/firestore";
import app from "../../firebase"; // Update the import path as necessary

export const saveToFirestore = async (data, projectName, mode) => {
  const db = getFirestore(app);
  const adsCollectionRef = collection(db, "ads");
  try {
    const docRef = await addDoc(adsCollectionRef, {
      ...data,
      projectName,
      mode,
    });
    console.log("Document written with ID:", docRef.id);
  } catch (error) {
    console.error("Error adding document to Firestore:", error);
  }
};
