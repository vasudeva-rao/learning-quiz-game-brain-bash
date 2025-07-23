import { Configuration, PublicClientApplication } from "@azure/msal-browser";

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID || "", // Azure AD Application (client) ID
    authority: import.meta.env.VITE_MSAL_AUTHORITY || "", // Authority URL
    redirectUri: import.meta.env.VITE_MSAL_REDIRECT_URI || "", // Redirect URI
  },
  cache: {
    cacheLocation: "localStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
};

console.log("MSAL Config:", msalConfig);

// Add scopes here for ID token to be used at Microsoft identity platform endpoints.
export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"],
};

// Create the main instance of PublicClientApplication
export const msalInstance = new PublicClientApplication(msalConfig);

// Initialize MSAL
export const initializeMsal = async () => {
  await msalInstance.initialize();
  
  // Handle the response from redirect flow
  const response = await msalInstance.handleRedirectPromise();
  if (response) {
    console.log("Login successful:", response);
  }
}; 