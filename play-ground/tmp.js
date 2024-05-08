class Section {
  constructor(id, content, historyItemId) {
    this.id = id;
    this.content = content;
    this.historyItemId = historyItemId; // This will also be used as the key in the enclosing object
  }

  serialize() {
    // Returns a plain object representing the Section
    return {
      id: this.id,
      content: this.content,
      historyItemId: this.historyItemId, // Ensure historyItemId is part of the serialized output
    };
  }
}

const isSection = (value) => {
  return value instanceof Section;
};

const serializeProperties = (dataObject) => {
  if (Array.isArray(dataObject)) {
    // Process each item in the array
    return dataObject.map((item) => serializeProperties(item));
  } else if (typeof dataObject === "object" && dataObject !== null) {
    // Process each key in the object
    const serializedObject = {};
    for (const key in dataObject) {
      const value = dataObject[key];
      if (isSection(value)) {
        // Serialize the Section object and use its historyItemId as the key
        serializedObject[value.historyItemId] = value.serialize();
      } else if (typeof value === "object") {
        // Recursively serialize the properties
        serializedObject[key] = serializeProperties(value);
      } else {
        // Return primitive types as is
        serializedObject[key] = value;
      }
    }
    return serializedObject;
  } else {
    // Return primitive types as is
    return dataObject;
  }
};

// Example usage:
const section1 = new Section(1, "Content 1", 101);
const section2 = new Section(2, "Content 2", 102);
const section3 = new Section(3, "Content 3", 103);

const dataPatternB = [{ 0: section1, 1: section2 }, { 0: section3 }];

const dataPatternA = [section1, section2];

console.dir(serializeProperties(dataPatternA), { depth: null });
console.dir(serializeProperties(dataPatternB), { depth: null });
