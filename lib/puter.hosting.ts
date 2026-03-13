import puter from "@heyputer/puter.js";
import {
  createHostingSlug,
  fetchBlobFromUrl,
  getHostedUrl,
  getImageExtension,
  HOSTING_CONFIG_KEY,
  imageUrlToPngBlob,
  isHostedUrl,
} from "./utils";

// Function takes no parameters and returns a Promise.
// The Promise resolves to a HostingConfig object (with subdomain) or null.

// 1. Get or create your subdomain
export const getOrCreateHostingConfig =
  async (): Promise<HostingConfig | null> => {
    // Get hosting config from Puter KV storage using HOSTING_CONFIG_KEY
    // Cast the result as HostingConfig or null
    const existing = (await puter.kv.get(
      HOSTING_CONFIG_KEY,
    )) as HostingConfig | null;

    // If a subdomain already exists in storage, reuse it
    if (existing?.subdomain) return { subdomain: existing.subdomain };

    // If not found, generate a new unique subdomain slug
    // This subdomain represents a hosted folder on Puter used to store images
    const subdomain = createHostingSlug();

    try {
      // Create hosting space on Puter with the generated subdomain
      const created = await puter.hosting.create(subdomain, ".");

      // Return the created subdomain for future uploads
      const record =  { subdomain: created.subdomain };
      await puter.kv.set(HOSTING_CONFIG_KEY, record);
      return record;
    } catch (e) {
      // If hosting creation fails, log warning and return null
      console.warn(`could not find subdomain:${e}`);
      return null;
    }
  };

// 2. Upload an image to the hosting space
// this fun just takes an object
// object ka type is StoreHostedImageParams which has hosting, url, projectId, label
// Return type is Promise that resolves to HostedAsset or null
export const uploadImageToHosting = async ({
  hosting,
  url,
  projectId,
  label,
}: StoreHostedImageParams): Promise<HostedAsset | null> => {
  if (!hosting || !url) return null;
  if (isHostedUrl(url)) return { url };

  try {
    const resolved =
      label === "rendered"
        ? await imageUrlToPngBlob(url).then((blob) =>
            blob ? { blob, contentType: "image/png" } : null,
          )
        : await fetchBlobFromUrl(url);

    if (!resolved) return null;

    const contentType = resolved.contentType || resolved.blob.type || "";
    const ext = getImageExtension(contentType, url);
    const dir = `projects/${projectId}`;
    const filePath = `${dir}/${label}.${ext}`;

    const uploadFile = new File([resolved.blob], `${label}.${ext}`, {
      type: contentType,
    });

    await puter.fs.mkdir(dir, { createMissingParents: true });
    await puter.fs.write(filePath, uploadFile);

    const hostedUrl = getHostedUrl({ subdomain: hosting.subdomain }, filePath);

    return hostedUrl ? { url: hostedUrl } : null;
  } catch (e) {
    console.warn(`Failed to store hosted image: ${e}`);
    return null;
  }
};
