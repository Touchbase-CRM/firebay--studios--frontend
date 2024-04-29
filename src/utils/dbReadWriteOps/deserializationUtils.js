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

const readFromFirestore = async (spotName = null, spotId = null) => {
  const db = getFirestore(app);
  const adsCollectionRef = collection(db, "ads");

  if ((spotName && spotId) || (!spotName && !spotId)) {
    throw new Error(
      "Either spotName or spotId must be provided, but not both."
    );
  }

  try {
    let docsSnapshot;
    if (spotId) {
      const docRef = doc(db, "ads", spotId);
      const docSnapshot = await getDoc(docRef);
      if (!docSnapshot.exists()) {
        throw new Error("No document found with the provided spotId.");
      }
      docsSnapshot = docSnapshot.data();
    } else {
      const q = query(adsCollectionRef, where("spotName", "==", spotName));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        throw new Error("No documents found with the provided spotName.");
      }
      docsSnapshot = querySnapshot.docs[0].data(); // Assuming there's only one document per spotName
    }

    return docsSnapshot;
  } catch (error) {
    console.error("Error reading document from Firestore:", error);
    throw error;
  }
};

export const deserializeAndLoadModeData = async ({
  spotName = null,
  spotId = null,
}) => {
  const loadedData = await readFromFirestore(spotName, spotId);
  return loadedData;
};
