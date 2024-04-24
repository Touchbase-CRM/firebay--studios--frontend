//Relative path: src/utils/dbReadWriteOps/serializationUtils.js
import { getFirestore, collection, addDoc } from "firebase/firestore";
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
    return dataObject.map(serializeProperties);
  } else if (dataObject && typeof dataObject === "object") {
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

const saveToFirestore = async (data, projectName, mode) => {
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

export const serializeAndSaveModeData = async (
  mode,
  projectName,
  modeSpecificStates,
  sharedStates
) => {
  const serializedModeSpecificStates = serializeProperties(modeSpecificStates);
  const serializedSharedStates = serializeProperties(sharedStates);

  const data = {
    mode: mode,
    featureSpecificStates: serializedModeSpecificStates,
    sharedStates: serializedSharedStates,
  };

  await saveToFirestore(data, projectName, mode);
};
