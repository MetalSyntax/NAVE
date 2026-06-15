// Convert a File object to an ArrayBuffer
export const toArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("File conversion did not result in ArrayBuffer"));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Convert an ArrayBuffer stored in IndexedDB back to an Object URL for display
export const arrayBufferToUrl = (buffer: ArrayBuffer, mimeType = "image/jpeg"): string => {
  const blob = new Blob([buffer], { type: mimeType });
  return URL.createObjectURL(blob);
};
