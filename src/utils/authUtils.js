/**
 * Verify if the JWT token is valid and not expired
 * @returns {boolean} Whether the token is valid
 */
export const isTokenValid = () => {
  try {
    const token = localStorage.getItem("token");
    
    // If no token exists, it's invalid
    if (!token) return false;
    
    // Parse the token (format: header.payload.signature)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return false;
    
    // Decode the payload
    const payload = JSON.parse(atob(tokenParts[1]));
    
    // Check if token has expired
    if (!payload.exp || payload.exp < Date.now() / 1000) {
      console.log("Token expired");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
};

/**
 * Use React Router's navigate function if available, otherwise fallback to window.location
 * This prevents full page refreshes which can cause infinite loops
 */
export const clearAuthAndRedirect = (navigate = null) => {
  localStorage.removeItem("token");
  
  if (navigate && typeof navigate === 'function') {
    // Use React Router for a cleaner transition
    navigate("/login");
  } else {
    // Fallback to window.location only if necessary
    // Add a flag to prevent loops
    if (!window.isRedirecting) {
      window.isRedirecting = true;
      window.location.href = "/login";
    }
  }
};

/**
 * Enhanced fetch wrapper with better error handling
 */
export const authenticatedFetch = async (url, options = {}, navigate = null) => {
  try {
    const token = localStorage.getItem("token");
    
    if (!isTokenValid()) {
      clearAuthAndRedirect(navigate);
      throw new Error("Invalid token");
    }
    
    // Add authorization header
    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
    
    const response = await fetch(url, authOptions);
    
    // If unauthorized, redirect to login
    if (response.status === 401) {
      clearAuthAndRedirect(navigate);
      throw new Error("Unauthorized");
    }
    
    return response;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};
