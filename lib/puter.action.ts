import puter from "@heyputer/puter.js";
import {
  getOrCreateHostingConfig,
  uploadImageToHosting,
} from "./puter.hosting";
import { isHostedUrl } from "./utils";

export const signIn = async () => await puter.auth.signIn();

// Note: No 'await' here because puter.auth.signOut() is synchronous and does not return a Promise.
export const signOut = async () => puter.auth.signOut();

export const getCurrentUser = async () => {
  try {
    return await puter.auth.getUser();
  } catch {
    return null;
  }
};


export const createProject = async ({
  item,
}: CreateProjectParams): Promise<DesignItem | null | undefined> => {
  const projectId = item.id;

  const hosting = await getOrCreateHostingConfig();
  
  // If there’s a project ID and a rendered image, uploads it.
  // Otherwise, sets hostedRender to null.
  
  const hostedSource = projectId
    ? await uploadImageToHosting({
        hosting,
        url: item.sourceImage,
        projectId,
        label: "source",
      })
    : null;

// If there’s a project ID and a 3d rendered image, uploads it.
// Otherwise, sets hostedRender to null.

  const hostedRender =
    projectId && item.renderedImage
      ? await uploadImageToHosting({
          hosting,
          url: item.renderedImage,
          projectId,
          label: "rendered",
        })
      : null;

  // Uses the hosted image URL if available.
  // Otherwise, checks if the original image is already hosted (using isHostedUrl).
  // If neither, uses an empty string.
  const resolvedSource =
    hostedSource?.url ||
    (isHostedUrl(item.sourceImage) ? item.sourceImage : "");

  if (!resolvedSource) {
    console.warn(
      `Failed to resolve source image for project ${projectId} skipping save.`,
    );
    return null;
  }
  const resolvedRender = hostedRender?.url
    ? hostedRender?.url
    : item.renderedImage && isHostedUrl(item.renderedImage)
      ? item.renderedImage
      : undefined;

  const {
    sourcePath: _sourcePath,
    renderedPath: _renderedPath,
    publicPath: _publicPath,
    ...rest
  } = item;

  const payload = {
    ...rest,
    sourceImage: resolvedSource,
    renderedImage: resolvedRender,
  };

  try {
    // Call the Puter worker to store project in kv
    return payload;
  } catch (e) {
    console.log("Failed to save project", e);
    return null;
  }
};
