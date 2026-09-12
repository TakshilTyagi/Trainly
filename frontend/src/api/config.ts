/**
 * api/config.ts - Central API configuration
 * Points to the live Render backend in production,
 * and uses local relative proxy in local development.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? ''
    : 'https://trainly-dc4x.onrender.com');

export const apiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return API_BASE_URL + cleanPath;
};
