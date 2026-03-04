import puter from "@heyputer/puter.js";

export const signIn = async () => await puter.auth.signIn();

// Note: No 'await' here because puter.auth.signOut() is synchronous and does not return a Promise.
export const signOut = async () => puter.auth.signOut();  

export const getCurrentUser = async () =>{
    try {
        return await puter.auth.getUser();

    }
    catch 
    {
        return null;
    }
}