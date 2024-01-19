import useUserInputsStore from "../userInputs";

export const sectionQueueWrapperForDequeue = (
  zustandStore,
  navigationTarget,
  navigate
) => {
  const {
    sectionsQueue,
    dequeueSection,
    setOriginalScriptString,
    ogScriptWordsArray,
    setOgScriptWordsArray,
    transformedWords,
    setTransformedWords,
  } = zustandStore;

  console.log("Queue size:", sectionsQueue.size());
  if (sectionsQueue.size() === 0) {
    // Navigate to the specified target if the queue is empty
    navigate(navigationTarget);
  } else {
    console.log("Queue not empty, continue processing");
    dequeueSection(); // Remove the first item from the queue
    const lastDequeuedItem = useUserInputsStore.getState().lastDequeuedItem;

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
