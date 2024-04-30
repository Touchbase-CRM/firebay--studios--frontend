//Relative path: src/utils/dbReadWriteOps/serializationUtils.js
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import app from "../../firebase"; // Update the import path as necessary
import { getAuth } from "firebase/auth";

const isCustomClass = (obj) => obj?.signature === "fsCustomClass";
const auth = getAuth(app);

const userId = auth.currentUser.uid;

export const writeToFirestore = async (collectionName, data, docId = null) => {
  const db = getFirestore(app);
  const collectionRef = collection(db, collectionName);

  let docRef;
  if (docId) {
    // Updating an existing document
    docRef = doc(db, collectionName, docId);
    await setDoc(docRef, data, { merge: true });
  } else {
    // Creating a new document
    docRef = await addDoc(collectionRef, data);
  }
  return docRef.id;
};

const writeSpotMetaDataToFirestore = async ({
  spotName,
  spotId,
  created,
  lastDownloaded,
}) => {
  // Prepare the data to be written
  const data = {
    userId,
    spotName,
    created,
    lastDownloaded,
  };

  try {
    // Use the writeToFirestore function to write data
    const documentId = await writeToFirestore("spots_meta_data", data, spotId);
    return documentId;
  } catch (error) {
    console.error("Error writing spot meta data to Firestore:", error);
    throw error; // Rethrow the error for upstream handling
  }
};

const writeSpotStatesToFirestore = async (
  data,
  spotName = null,
  spotId = null
) => {
  // Assert that exactly one of spotName or spotId is provided
  if ((spotName && spotId) || (!spotName && !spotId)) {
    throw new Error(
      "Either spotName or spotId must be provided, but not both."
    );
  }

  try {
    let docId = spotId;
    let documentData = { ...data };

    // Include spotName in the data if creating a new document
    if (!docId && spotName) {
      documentData.spotName = spotName;
    }

    // Write to Firestore using the abstracted function
    const documentId = await writeToFirestore("ads", documentData, docId);
    console.log("Document written with ID:", documentId);
    return documentId; // Returning the document ID
  } catch (error) {
    console.error("Error writing document to Firestore:", error);
    throw error; // Rethrow the error for upstream handling
  }
};

const serializeProperties = (dataObject) => {
  if (Array.isArray(dataObject)) {
    return dataObject.map(serializeProperties);
  } else if (dataObject instanceof Map) {
    const result = {};
    dataObject.forEach((value, key) => {
      result[key] = serializeProperties(value);
    });
    return result;
  } else if (dataObject && typeof dataObject === "object") {
    return Object.keys(dataObject).reduce((serializedResult, key) => {
      const value = dataObject[key];
      if (isCustomClass(value)) {
        serializedResult[key] = value.serialize();
      } else if (typeof value === "object") {
        serializedResult[key] = serializeProperties(value);
      } else {
        serializedResult[key] = value;
      }
      return serializedResult;
    }, {});
  }
  return dataObject;
};

export const createSpotInDb = async ({
  spotName = null, // used when creating a new spot
  spotId = null, // used when updating an existing spot
  modeSpecificStates,
  sharedStates,
}) => {
  const serializedModeSpecificStates = serializeProperties(modeSpecificStates);
  const serializedSharedStates = serializeProperties(sharedStates);

  const data = {
    userId,
    featureSpecificStates: serializedModeSpecificStates,
    sharedStates: serializedSharedStates,
  };

  // Assert that exactly one of spotName or spotId is provided
  if ((spotName && spotId) || (!spotName && !spotId)) {
    throw new Error(
      "Either spotName or spotId must be provided, but not both."
    );
  }

  const savedSpotId = await writeSpotStatesToFirestore(data, spotName, spotId);

  if (spotName) {
    // only run when creating a new spot
    await writeSpotMetaDataToFirestore({
      spotName,
      spotId: savedSpotId,
      created: new Date(),
      lastDownloaded: null,
    });
  }
  return savedSpotId;
};
