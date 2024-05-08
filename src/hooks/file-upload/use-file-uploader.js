// relative path: src/hooks/fileUpload/useFileUploader.js
import { useCallback } from "react";

export const useFileUploader = (onUpload) => {
  const handleFileChange = useCallback(
    (event) => {
      const files = event.target.files;
      if (files.length > 0) {
        onUpload(files[0]); // Handle the file upload
      }
      // Reset the input value
      event.target.value = null;
    },
    [onUpload]
  );

  const openFileSelector = useCallback(() => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "audio/*";
    fileInput.onchange = handleFileChange;
    fileInput.click();
  }, [handleFileChange]);

  return { openFileSelector };
};
