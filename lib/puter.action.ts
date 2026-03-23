import puter from "@heyputer/puter.js";
import {
  getOrCreateHostingConfig,
  uploadImageToHosting,
} from "./puter.hosting";
import { isHostedUrl } from "./utils";
import { PUTER_WORKER_URL } from "./constants";

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
  visibility = "private",
}: CreateProjectParams): Promise<DesignItem | null | undefined> => {
  if (!PUTER_WORKER_URL) {
    console.warn("PUTER_WORKER_URL is missing. Skipping fetch projects");
    return null;
  }

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
    const response = await puter.workers.exec(
      `${PUTER_WORKER_URL}/api/projects/save`,
      {
        method: "POST",
        body: JSON.stringify({
          project: payload,
          visibility,
        }),
      },
    );
    if (!response.ok) {
      console.error(
        "Failed to save project, response not ok",
        await response.text(),
      );
      return null;
    }
    const data = (await response.json()) as { project: DesignItem | null };

    return data?.project ?? null;
  } catch (e) {
    console.log("Failed to save project", e);
    return null;
  }
};

export const getProjects = async () => {
  if (!PUTER_WORKER_URL) {
    console.warn("PUTER_WORKER_URL is missing. Skipping fetch projects");
    return [];
  }

  try {
    const response = await puter.workers.exec(
      `${PUTER_WORKER_URL}/api/projects/list`,
      { method: "GET" },
    );

    if (!response.ok) {
      console.warn(
        "Failed to fetch projects, response not ok",
        await response.text(),
      );
      return [];
    }

    const data = (await response.json()) as { projects: DesignItem[] | null };
    // check if data?.projects actually and array if yes then return it else return empty array []
    return Array.isArray(data?.projects) ? data?.projects : [];
    // Array.isArray(value) is a built-in JavaScript method.
    // It checks if the given value is an array.
  } catch (e) {
    console.log("Failed to fetch projects", e);
    return [];
  }
};

export const getProjectById = async ({ id }: { id: string }) => {
  if (!PUTER_WORKER_URL) {
    console.warn("Missing VITE_PUTER_WORKER_URL; skipping project fetch.");
    return null;
  }

  console.log("Fetching project with ID:", id);

  try {
    const response = await puter.workers.exec(
      `${PUTER_WORKER_URL}/api/projects/get?id=${encodeURIComponent(id)}`,
      { method: "GET" },
    );

    console.log("Fetch project response:", response);

    if (!response.ok) {
      console.error("Failed to fetch project:", await response.text());
      return null;
    }

    const data = (await response.json()) as {
      project?: DesignItem | null;
    };

    console.log("Fetched project data:", data);

    return data?.project ?? null;
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return null;
  }
};
