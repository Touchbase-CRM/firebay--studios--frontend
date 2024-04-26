//Relative path: src/utils/dbReadWriteOps/serializationUtils.js
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import app from "../../firebase"; // Update the import path as necessary

const isCustomClass = (obj) => obj?.signature === "fsCustomClass";

const serializeInstance = (instance) => {
  const proto = Object.getPrototypeOf(instance);
  return Object.getOwnPropertyNames(proto)
    .filter(
      (prop) => typeof instance[prop] === "function" && prop.startsWith("get")
    )
    .reduce((acc, getterName) => {
      const propName = getterName.charAt(3).toLowerCase() + getterName.slice(4);
      acc[propName] = instance[getterName]();
      return acc;
    }, {});
};

const serializeProperties = (dataObject) => {
  if (Array.isArray(dataObject)) {
    // Handle arrays by recursively serializing each element
    return dataObject.map(serializeProperties);
  } else if (dataObject instanceof Map) {
    // Handle Map objects by serializing each entry
    const result = {};
    dataObject.forEach((value, key) => {
      result[key] = isCustomClass(value)
        ? serializeInstance(value)
        : typeof value === "object"
        ? serializeProperties(value)
        : value;
    });
    return result;
  } else if (dataObject && typeof dataObject === "object") {
    // Handle standard objects and check each property
    return Object.keys(dataObject).reduce((serializedResult, key) => {
      const value = dataObject[key];
      serializedResult[key] = isCustomClass(value)
        ? serializeInstance(value)
        : typeof value === "object"
        ? serializeProperties(value)
        : value;
      return serializedResult;
    }, {});
  }
  return dataObject;
};

const saveToFirestore = async (data, spotName = null, spotId = null) => {
  const db = getFirestore(app);
  const adsCollectionRef = collection(db, "ads");

  // Assert that exactly one of spotName or spotId is provided
  if ((spotName && spotId) || (!spotName && !spotId)) {
    throw new Error(
      "Either spotName or spotId must be provided, but not both."
    );
  }

  try {
    let docRef;
    if (spotId) {
      // When updating, we use the existing spotId
      const existingDocRef = doc(db, "ads", spotId);
      await setDoc(
        existingDocRef,
        {
          ...data,
        },
        { merge: true }
      );
      docRef = existingDocRef;
    } else {
      // When creating a new document, spotName must be provided
      docRef = await addDoc(adsCollectionRef, {
        ...data,
        spotName: spotName,
      });
    }
    console.log("Document written with ID:", docRef.id);
    return docRef.id; // Returning the document ID
  } catch (error) {
    console.error("Error adding document to Firestore:", error);
    throw error; // Rethrow the error for upstream handling
  }
};

export const serializeAndSaveModeData = async ({
  spotName = null, // used when creating a new spot
  spotId = null, // used when updating an existing spot
  modeSpecificStates,
  sharedStates,
}) => {
  const serializedModeSpecificStates = serializeProperties(modeSpecificStates);
  const serializedSharedStates = serializeProperties(sharedStates);

  const data = {
    featureSpecificStates: serializedModeSpecificStates,
    sharedStates: serializedSharedStates,
  };

  // Assert that exactly one of spotName or spotId is provided
  if ((spotName && spotId) || (!spotName && !spotId)) {
    throw new Error(
      "Either spotName or spotId must be provided, but not both."
    );
  }

  const savedSpotId = await saveToFirestore(data, spotName, spotId);
  return savedSpotId;
};
