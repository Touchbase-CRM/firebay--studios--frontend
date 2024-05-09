useEffect(() => {
  console.log("inside useEffect");
  const serializeClassInstance = (instance) => {
    const proto = Object.getPrototypeOf(instance);
    const serialized = {};

    // Filter only the getter methods
    Object.getOwnPropertyNames(proto)
      .filter(
        (prop) => typeof instance[prop] === "function" && prop.startsWith("get")
      )
      .forEach((getterName) => {
        // Convert getter method name to property name (e.g., 'getOriginalContent' to 'originalContent')
        const propName = getterName.replace("get", "");
        const serializablePropName =
          propName.charAt(0).toLowerCase() + propName.slice(1);
        serialized[serializablePropName] = instance[getterName]();
      });

    return serialized;
  };

  // Serialize the entire sectionsArray using the generic serialization function
  const serializedSections = sectionsArray.map(serializeClassInstance);

  // Firestore setup
  const db = getFirestore(app);

  // Write to Firestore
  const saveSectionsToFirestore = async () => {
    const adsCollectionRef = collection(db, "ads");

    try {
      const docRef = await addDoc(adsCollectionRef, {
        sectionsArray: serializedSections,
      });
      console.log("Document written with ID:", docRef.id);
    } catch (error) {
      console.error("Error adding document:", error);
    }
  };

  saveSectionsToFirestore();
}, []);

const extractKeys = (obj) => Object.keys(obj);
const extractValues = (obj) => Object.values(obj);
const modeSpecificKeys = extractKeys(advancedScriptToAdDefaultValues);
const modeSpecificValues = extractValues(advancedScriptToAdDefaultValues);

useEffect(() => {
  const isCustomClass = (obj) => obj?.signature === "fsCustomClass";

  const serializeInstance = (instance) => {
    console.log("Serializing instance:", instance);
    const proto = Object.getPrototypeOf(instance);
    return Object.getOwnPropertyNames(proto)
      .filter(
        (prop) => typeof instance[prop] === "function" && prop.startsWith("get")
      )
      .reduce((acc, getterName) => {
        const propName =
          getterName.charAt(3).toLowerCase() + getterName.slice(4);
        acc[propName] = instance[getterName]();
        return acc;
      }, {});
  };

  const serializeProperties = (dataObject) => {
    if (Array.isArray(dataObject)) {
      return dataObject.map((item) => serializeProperties(item)); // Recursively serialize each item in the array
    } else if (typeof dataObject === "object" && dataObject !== null) {
      return Object.keys(dataObject).reduce((serializedResult, key) => {
        const value = dataObject[key];
        serializedResult[key] = isCustomClass(value)
          ? serializeInstance(value)
          : typeof value === "object"
          ? serializeProperties(value)
          : value; // Recursively serialize if it's an object
        return serializedResult;
      }, {});
    }
    return dataObject; // Return as is if not an object or array
  };

  const serializedConfig = serializeProperties(storeData);
  console.log("Serialized Config:", serializedConfig);

  // Write to Firestore
  const saveSectionsToFirestore = async () => {
    const db = getFirestore(app);
    const adsCollectionRef = collection(db, "ads");

    try {
      const docRef = await addDoc(adsCollectionRef, {
        test2: serializedConfig,
      });
      console.log("Document written with ID:", docRef.id);
    } catch (error) {
      console.error("Error adding document to Firestore:", error);
    }
  };

  saveSectionsToFirestore();
}, [sectionHistoryArray]);
