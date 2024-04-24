//Relative path: src/utils/dbReadWriteOps/serializationUtils.js

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

export const serializeProperties = (dataObject) => {
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
