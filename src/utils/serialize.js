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

export default serializeClassInstance;
