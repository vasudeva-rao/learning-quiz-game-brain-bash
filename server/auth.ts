import { Request, Response, NextFunction } from "express";

// Extended Request interface to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name?: string;
    email?: string;
    username?: string;
  };
}

/**
 * Middleware to validate Microsoft access tokens
 */
export const validateMsalToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No valid access token provided" });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // For now, we'll do a simple validation by calling Microsoft Graph
    // In production, you might want to validate the token signature locally
    const response = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return res.status(401).json({ error: "Invalid access token" });
    }

    const userInfo = await response.json();
    
    // Attach user information to the request
    req.user = {
      id: userInfo.id,
      name: userInfo.displayName,
      email: userInfo.mail || userInfo.userPrincipalName,
      username: userInfo.userPrincipalName,
    };

    next();
  } catch (error) {
    console.error("Token validation error:", error);
    return res.status(401).json({ error: "Failed to validate access token" });
  }
};

/**
 * Optional middleware that allows but doesn't require authentication
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      
      const response = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userInfo = await response.json();
        req.user = {
          id: userInfo.id,
          name: userInfo.displayName,
          email: userInfo.mail || userInfo.userPrincipalName,
          username: userInfo.userPrincipalName,
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail if optional auth fails, just continue without user info
    console.error("Optional auth error:", error);
    next();
  }
}; 