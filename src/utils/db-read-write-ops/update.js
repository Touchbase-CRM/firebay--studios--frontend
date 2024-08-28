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

export const addNewFirestoreField = async ({
  collectionName,
  docId,
  fieldName,
  newValue,
}) => {
  try {
    // Reference to the document
    const docRef = doc(db, collectionName, docId);
    // Set the new field in the document
    await updateDoc(docRef, {
      [fieldName]: newValue,
    });
  } catch (error) {
    console.error(`Error adding field in ${collectionName}:`, error);
    throw error; // Rethrow the error for upstream handling
  }
};

export const updateExistingFirestoreField = async ({
  collectionName,
  docId,
  fieldName,
  newValue,
}) => {
  try {
    // Reference to the document
    const docRef = doc(db, collectionName, docId);
    // Get the document snapshot to check if the field exists
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists() && docSnapshot.data().hasOwnProperty(fieldName)) {
      // Update the existing field
      await updateDoc(docRef, {
        [fieldName]: newValue,
      });
    } else {
      throw new Error(`Field "${fieldName}" does not exist in document ${docId}`);
    }
  } catch (error) {
    console.error(`Error updating existing field in ${collectionName}:`, error);
    throw error; // Rethrow the error for upstream handling
  }
};

