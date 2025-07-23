import * as React from "react";
import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  ReactNode 
} from "react";
import { 
  AccountInfo, 
  AuthenticationResult, 
  InteractionRequiredAuthError,
  SilentRequest
} from "@azure/msal-browser";
import { msalInstance, loginRequest } from "@/lib/auth-config";
import { useToast } from "./use-toast";
import { setAccessTokenProvider } from "@/lib/queryClient";

interface AuthContextType {
  user: AccountInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Initializing MSAL...");
        await msalInstance.initialize();
        
        console.log("Handling redirect promise...");
        // Handle redirect response
        const response = await msalInstance.handleRedirectPromise();
        console.log("Redirect response:", response);
        
        if (response) {
          console.log("Setting user from redirect response:", response.account);
          setUser(response.account);
          setIsAuthenticated(true);
          toast({
            title: "Login Successful",
            description: `Welcome, ${response.account?.name || response.account?.username}!`,
          });
        } else {
          // Check if user is already logged in
          console.log("No redirect response, checking existing accounts...");
          const accounts = msalInstance.getAllAccounts();
          console.log("Existing accounts:", accounts);
          if (accounts.length > 0) {
            console.log("Setting user from existing account:", accounts[0]);
            setUser(accounts[0]);
            setIsAuthenticated(true);
          } else {
            console.log("No existing accounts found");
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        toast({
          title: "Authentication Error",
          description: "Failed to initialize authentication",
          variant: "destructive",
        });
      } finally {
        console.log("Auth initialization complete, setting loading to false");
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [toast]);

  // Set up access token provider for API requests
  useEffect(() => {
    console.log("Setting access token provider, user:", user);
    setAccessTokenProvider(getAccessToken);
  }, [user]); // Update whenever user changes, not just on mount

  const login = async () => {
    try {
      setIsLoading(true);
      // Use redirect flow instead of popup
      await msalInstance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Failed to sign in. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
    // Note: setIsLoading(false) will be called in handleRedirectPromise
  };

  const logout = async () => {
    try {
      await msalInstance.logoutRedirect();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    // Get the current accounts from MSAL instead of relying on React state
    const accounts = msalInstance.getAllAccounts();
    const currentUser = accounts.length > 0 ? accounts[0] : null;
    
    console.log("getAccessToken called, React user:", user, "MSAL accounts:", accounts.length, "currentUser:", currentUser);
    
    if (!currentUser) {
      console.log("No current user found, returning null");
      return null;
    }

    const silentRequest: SilentRequest = {
      scopes: loginRequest.scopes,
      account: currentUser,
    };

    try {
      console.log("Attempting silent token acquisition...");
      const response = await msalInstance.acquireTokenSilent(silentRequest);
      console.log("Silent token acquisition successful:", response.accessToken ? "Token obtained" : "No token");
      return response.accessToken;
    } catch (error) {
      console.log("Silent token acquisition failed:", error);
      if (error instanceof InteractionRequiredAuthError) {
        try {
          console.log("Attempting interactive token acquisition...");
          // Use redirect flow for interactive token acquisition too
          await msalInstance.acquireTokenRedirect(loginRequest);
          return null; // Token will be available after redirect
        } catch (interactiveError) {
          console.error("Interactive token acquisition failed:", interactiveError);
          return null;
        }
      } else {
        console.error("Silent token acquisition failed:", error);
        return null;
      }
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}; 