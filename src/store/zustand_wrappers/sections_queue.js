import useUserInputsStore from "../userInputs";

export const sectionQueueWrapperForDequeue = (zustandStore) => {
  const {
    sectionsQueue,
    dequeueSection,
    setOriginalScriptString,
    ogScriptWordsArray,
    setOgScriptWordsArray,
    transformedWords,
    setTransformedWords,
  } = zustandStore;

  if (sectionsQueue.size() !== 0) {
    console.log("Queue not empty, continue processing");
    dequeueSection(); // Remove the first item from the queue
    const lastDequeuedItem = useUserInputsStore
      .getState()
      .lastDequeuedItem.getCurrentContent();

    // Update the original script string to the last dequeued item
    setOriginalScriptString(lastDequeuedItem || "");

    // Split the dequeued item into words and update transformed words
    const newWords = lastDequeuedItem ? lastDequeuedItem.split(" ") : [];
    const newTransformedWords = {};

    newWords.forEach((word, index) => {
      if (ogScriptWordsArray[index] === word && transformedWords[index]) {
        newTransformedWords[index] = transformedWords[index];
      }
    });

    // Update the original script words array and transformed words
    setOgScriptWordsArray(newWords);
    setTransformedWords(newTransformedWords);
  }
};
