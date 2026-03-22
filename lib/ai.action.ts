import puter from "@heyputer/puter.js";
import { ROOMIFY_RENDER_PROMPT } from "./constants";

export async function fetchAsDataUrl(url: string): Promise<string> {
  // Fetch always gives u an ResponseObject = {header,status,body,...}
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch image: ${response.status} ${response.statusText}`,
    );
  }

  // Convert the response to a Blob, which can be read as a Data URL
  // blob look like
  /*
   blob {
  size: 12345,
  type: "image/png",
  slice: function() { ... } }  
   */
  const blob = await response.blob();

  // Whenever you're creating a new promise from scratch, you must use the new keyword—otherwise, you’re not actually constructing a valid promise.
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); // browser API to read file or blob as (data url = file convert to base64 string)
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);


    // 👉 Start reading Blob → converts it to Data URL (base64 string)
    // After this, browser will later trigger onloadend OR onerror
    reader.readAsDataURL(blob);
  });
}

export const generate3DView = async ({ sourceImage }: Generate3DViewParams) => {
  // It checks if a string begins with given text → returns true/false.
  const dataUrl = sourceImage.startsWith("data:")
    ? sourceImage
    : await fetchAsDataUrl(sourceImage);
    // Listen : my doubt dataurl we should get a string but fetchAsDataUrl is giving promise
    // answer : we are using await in line  : await fetchAsDataUrl(sourceImage); means await will extract resolved value from the promise.


    // base64data : "data:image/png;base64  ,iVBORw0KGgoAAA..."
  const base64Data = dataUrl.split(",")[1];
  const mimeType = dataUrl.split(";")[0].split(":")[1];
  /* 
  dataUrl.split(";")[0]     // "data:image/png"
  .split(":")[1]           // "image/png"
  */

  if (!mimeType || !base64Data) {
    throw new Error("Invalid image data");
  }

  // puter.ai.txt2img returns an HTMLImageElement where .src contains the image URL or base64 data
  const response = await puter.ai.txt2img(ROOMIFY_RENDER_PROMPT, {
    provider: "gemini",
    model: "gemini-2.5-flash-image-preview",
    input_image: base64Data,
    input_image_mime_type: mimeType,
    ratio: { w: 1024, h: 1024 },
  });

  const rawImageUrl = (response as HTMLImageElement).src ?? null;
  // Nullish Coalescing Operator= ?? returns right value only if left is null or undefined, otherwise returns left


  if (!rawImageUrl) {
    return { renderedImage: null, renderedPath: undefined };
  }
  const renderedImage = rawImageUrl.startsWith("data:")
    ? rawImageUrl
    : await fetchAsDataUrl(rawImageUrl);
// if rawimageurl is url then convert it into base64 dataurl
  return { renderedImage, renderedPath: undefined };
};
