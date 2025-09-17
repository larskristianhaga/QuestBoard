import { auth } from 'app/auth';

export const getValidAuthHeaders = async (): Promise<Record<string, string>> => {
  const authHeaderValue = await auth.getAuthHeaderValue();
  
  // Only add Authorization header if we have a valid Bearer token
  if (authHeaderValue && authHeaderValue.startsWith('Bearer ') && authHeaderValue !== 'Bearer ' && authHeaderValue !== 'Bearer') {
    return {
      Authorization: authHeaderValue,
    };
  }
  
  // Return empty headers if no valid token
  return {};
};

export const getValidAuthToken = async (): Promise<string | null> => {
  const token = await auth.getAuthToken();
  
  // Only return token if it's not empty
  if (token && token.trim() !== '') {
    return token;
  }
  
  return null;
};
