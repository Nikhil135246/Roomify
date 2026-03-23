const PROJECT_PREFIX = 'roomify_project_';

const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

const jsonError = (status, message, extra = {}) => {
    return new Response(JSON.stringify({ error: message, ...extra }), {
        status, headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
        // header we configuring , cros and saying content type is json
    })
}

const getUserId = async (userPuter) => {
    try {
        const user = await userPuter.auth.getUser();
        // puter know the authcontext of user , so we can get the user id from there, if user is not authenticated, it will return null
        return user?.uuid || null;
    }
    catch {
        return null;
    }
}

// we are kinda doin crud opration 

// create or update project
router.post('/api/projects/save', async ({ request, user }) => {

    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, "Authentication failed");
        const body = await request.json();
        const project = body?.project;
        const visibility = body?.visibility || "private";

        if (!project?.id || !project?.sourceImage) return jsonError(400, "Project ID and source image are required");

        const payload = {
            ...project,
            isPublic: visibility === "public",
            updatedAt: new Date().toISOString(),
        }
        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, "Unauthorized");

        // Save the project data in KV storage using a unique key
        const key = `${PROJECT_PREFIX}${project.id}`;

        // save or update project within the same key on submit
        await userPuter.kv.set(key, payload);
        return jsonResponse({ saved: true, id: project.id, project: payload });

    } catch (e) {
        return jsonError(500, "Failed to save project", { message: e.message || 'Unknown error' })
    }
})

// list all projects
router.get('/api/projects/list', async ({ user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, "Authentication failed");

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, "Unauthorized");

        // Get all keys starting with PROJECT_PREFIX

        // we saying from list : give everything thing start with project_prefix and, setting true for (include values) means give values too of that key
        const projects = (await userPuter.kv.list(PROJECT_PREFIX, true)).map(({ value }) => ({
            ...value,
            isPublic: value.isPublic ?? false,
        }));

        // oneliner : get list of key value, isolate only value and preserve isPublic from stored data


        return jsonResponse({ projects });
    } catch (e) {
        return jsonError(500, "Failed to list projects", { message: e.message || 'Unknown error' });
    }
});

// get a specific project by id
router.get('/api/projects/get', async ({ request, user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, "Authentication failed");

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, "Authentication failed");

        // Extract id from search params
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return jsonError(400, "Missing project id");

        // Fetch the project from KV store using prefixed key
        const key = `${PROJECT_PREFIX}${id}`;
        const project = await userPuter.kv.get(key);

        if (!project) return jsonError(404, "Project not found");

        return jsonResponse({ project });
    } catch (e) {
        return jsonError(500, "Failed to get project", { message: e.message || 'Unknown error' });
    }
});

