import { getFirestore, doc, updateDoc, arrayUnion } from "firebase/firestore";
import app from "../../firebase"; // Update the import path as necessary

const db = getFirestore(app);

export const appendToFirestoreArray = async ({
  collectionName,
  docId,
  fieldName,
  newValue,
}) => {
  try {
    // Reference to the document
    const docRef = doc(db, collectionName, docId);
    // Use Firestore's arrayUnion to append the new value to the array
    await updateDoc(docRef, {
      [fieldName]: arrayUnion(newValue),
    });
  } catch (error) {
    console.error(`Error appending to array in ${collectionName}:`, error);
    throw error; // Rethrow the error for upstream handling
  }
};

export const setFirestoreField = async ({
  collectionName,
  docId,
  fieldName,
  newValue,
  createIfNotExists = true,
}) => {
  try {
    const docRef = doc(db, collectionName, docId);

    if (!createIfNotExists) {
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists() || !docSnapshot.data()[fieldName]) {
        throw new Error(`Field "${fieldName}" does not exist in document ${docId}`);
      }
    }

    await updateDoc(docRef, { [fieldName]: newValue });
  } catch (error) {
    console.error(`Error setting field in ${collectionName}:`, error);
    throw error;
  }
};



