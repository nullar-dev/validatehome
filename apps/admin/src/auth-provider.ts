import type { AuthProvider } from "@refinedev/core";

export const AUTH_STORAGE_KEY = "validatehome_admin_api_key";

export const authProvider: AuthProvider = {
  login: async ({ apiKey }) => {
    if (apiKey) {
      localStorage.setItem(AUTH_STORAGE_KEY, apiKey);
      return {
        success: true,
        redirectTo: "/",
      };
    }
    return {
      success: false,
      error: {
        name: "LoginError",
        message: "API key is required",
      },
    };
  },

  logout: async () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return {
      success: true,
      redirectTo: "/login",
    };
  },

  check: async () => {
    const apiKey = localStorage.getItem(AUTH_STORAGE_KEY);
    if (apiKey) {
      return {
        authenticated: true,
        redirectTo: "/",
      };
    }
    return {
      authenticated: false,
      redirectTo: "/login",
    };
  },

  getPermissions: async () => {
    const apiKey = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!apiKey) {
      return null;
    }
    return ["admin"];
  },

  getIdentity: async () => {
    const apiKey = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!apiKey) {
      return null;
    }
    return {
      id: "admin-user",
      name: "Admin User",
      avatar: undefined,
    };
  },

  onError: async (error) => {
    if (error.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return {
        logout: true,
        redirectTo: "/login",
      };
    }
    return { error };
  },
};

export function getStoredApiKey(): string | null {
  return localStorage.getItem(AUTH_STORAGE_KEY);
}
