// Relative path: src/utils/dbReadWriteOps/deserializationUtils.js
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import app from "../../firebase"; // Update the import path as necessary
import { Section } from "../../dataStructures/section";

const isSerializedCustomClass = (obj) =>
  typeof obj === "object" &&
  obj !== null &&
  "signature" in obj &&
  obj.signature === "fsCustomClass";

const deserializeInstance = (serializedInstance) => {
  const instance = new Section(); // Adjust the class name as necessary
  for (const [key, value] of Object.entries(serializedInstance)) {
    instance[`set${key.charAt(0).toUpperCase() + key.slice(1)}`](value);
  }
  return instance;
};

const deserializeProperties = (dataObject) => {
  if (Array.isArray(dataObject)) {
    return dataObject.map(deserializeProperties);
  } else if (dataObject instanceof Object) {
    const result = {};
    for (const [key, value] of Object.entries(dataObject)) {
      result[key] = isSerializedCustomClass(value)
        ? deserializeInstance(value)
        : typeof value === "object"
        ? deserializeProperties(value)
        : value;
    }
    return result;
  }
  return dataObject;
};

const readSpotsFromFirestore = async (spotName = null, spotId = null) => {
  if ((spotName && spotId) || (!spotName && !spotId)) {
    throw new Error(
      "Either spotName or spotId must be provided, but not both."
    );
  }

  try {
    if (spotId) {
      return await readFromFirestore("ads", spotId);
    } else {
      const db = getFirestore(app);
      const adsCollectionRef = collection(db, "ads");
      const q = query(adsCollectionRef, where("spotName", "==", spotName));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error("No documents found with the provided spotName.");
      }
      return querySnapshot.docs[0].data(); // Assuming there's only one document per spotName
    }
  } catch (error) {
    console.error("Error reading spots from Firestore:", error);
    throw error;
  }
};

export const readFromFirestore = async (
  collectionName,
  docId = null,
  fieldName = null
) => {
  const db = getFirestore(app);

  try {
    if (docId) {
      const docRef = doc(db, collectionName, docId);
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        throw new Error("No document found with the provided ID.");
      }
      return fieldName ? docSnapshot.data()[fieldName] : docSnapshot.data();
    } else {
      throw new Error("Document ID must be provided.");
    }
  } catch (error) {
    console.error(`Error reading from Firestore (${collectionName}):`, error);
    throw error;
  }
};

export const deserializeAndLoadModeData = async ({
  spotName = null,
  spotId = null,
}) => {
  const loadedData = await readSpotsFromFirestore(spotName, spotId);
  return loadedData;
};
