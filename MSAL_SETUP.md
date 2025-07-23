# Microsoft Azure AD Authentication Setup Guide

## Overview

This application now uses Microsoft Azure AD (MSAL) for authentication. Hosts must sign in with their Microsoft account to create and manage quiz games. Game history is now linked to user accounts instead of localStorage.

## Azure AD App Registration Setup

### 1. Create an Azure AD App Registration

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: Brain Bash Quiz App (or your preferred name)
   - **Supported account types**: Choose based on your needs:
     - **Single tenant**: Only users in your organization
     - **Multitenant**: Users in any organization
     - **Multitenant + personal**: Users in any organization + personal Microsoft accounts
   - **Redirect URI**: 
     - Type: **Single-page application (SPA)**
     - URL: `http://localhost:5000` (for development)

### 2. Configure Authentication

1. In your app registration, go to **Authentication**
2. Under **Single-page application**, ensure your redirect URI is listed
3. Under **Implicit grant and hybrid flows**, check:
   - ✅ **Access tokens**
   - ✅ **ID tokens**
4. Save the changes

### 3. Configure API Permissions

1. Go to **API permissions**
2. Ensure these permissions are present:
   - ✅ **Microsoft Graph** > **User.Read** (Delegated)
3. Grant admin consent if required by your organization

### 4. Get Configuration Values

1. Go to **Overview** in your app registration
2. Copy these values:
   - **Application (client) ID**
   - **Directory (tenant) ID** (optional, use "common" for multi-tenant)

## Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Client-side MSAL configuration (for React app)
VITE_MSAL_CLIENT_ID=your-azure-ad-client-id
VITE_MSAL_AUTHORITY=https://login.microsoftonline.com/common
VITE_MSAL_REDIRECT_URI=http://localhost:5000

# Server-side MSAL configuration (for Node.js API)
MSAL_CLIENT_ID=your-azure-ad-client-id
MSAL_AUTHORITY=https://login.microsoftonline.com/common
MSAL_CLIENT_SECRET=your-azure-ad-client-secret

# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/brain-bash
```

### Configuration Details

- **VITE_MSAL_CLIENT_ID / MSAL_CLIENT_ID**: Your Application (client) ID from Azure AD
- **VITE_MSAL_AUTHORITY / MSAL_AUTHORITY**: 
  - Use `https://login.microsoftonline.com/common` for multi-tenant apps
  - Use `https://login.microsoftonline.com/{tenant-id}` for single-tenant apps
- **VITE_MSAL_REDIRECT_URI**: Must match the redirect URI configured in Azure AD
- **MSAL_CLIENT_SECRET**: Only needed for server-side validation (optional for this implementation)

## Application Flow

### 1. Authentication Required for Hosts

- When users click "Create Game" on the home page, they are redirected to a login page
- The login page uses MSAL to authenticate with Microsoft
- Only authenticated users can access the host dashboard

### 2. Game Management

- Games are now associated with the authenticated user's ID
- Game history is fetched from the database based on the user's ID
- Users can only rehost games they created

### 3. Player Experience

- Players joining games do NOT need to authenticate
- The join game flow remains unchanged

## Production Deployment

### 1. Update Redirect URIs

In your Azure AD app registration:
1. Go to **Authentication**
2. Add your production domain redirect URI
3. Example: `https://yourdomain.com`

### 2. Update Environment Variables

Update your production environment with:
- Correct production redirect URI
- Production MongoDB connection string

### 3. CORS Configuration

Ensure your server allows requests from your production domain.

## Troubleshooting

### Common Issues

1. **"MSAL Configuration Error"**
   - Check that all environment variables are set correctly
   - Verify the client ID matches your Azure AD app registration

2. **"Redirect URI Mismatch"**
   - Ensure the redirect URI in your `.env` file matches exactly what's configured in Azure AD
   - Include the protocol (http/https) and port number

3. **"Permission Denied"**
   - Verify API permissions are configured and granted
   - Check that User.Read permission is present

4. **"Token Validation Failed"**
   - Ensure the server can reach Microsoft Graph API
   - Check network connectivity and firewall settings

### Debug Mode

To enable debug logging, add this to your client-side code temporarily:

```javascript
// In client/src/lib/auth-config.ts
export const msalConfig: Configuration = {
  // ... existing config
  system: {
    loggerOptions: {
      loggerCallback: (level, message) => {
        console.log(`MSAL [${level}]:`, message);
      },
      logLevel: LogLevel.Verbose,
    },
  },
};
```

## Security Considerations

1. **Never commit your `.env` file** - it contains sensitive information
2. **Use HTTPS in production** - required for secure token transmission
3. **Regularly rotate client secrets** if using confidential client flow
4. **Monitor app registration activity** in Azure AD for suspicious access

## Support

If you encounter issues:
1. Check the browser console for MSAL-related errors
2. Verify your Azure AD app registration configuration
3. Ensure all environment variables are correctly set
4. Test with a different Microsoft account to rule out account-specific issues 