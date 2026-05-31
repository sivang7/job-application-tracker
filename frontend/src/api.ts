// Thin fetch helper for the backend API.
// All calls go through "/api", which the Vite dev proxy forwards to
// http://localhost:3001 (stripping the /api prefix).
//
// Application CRUD calls (list/create/update/delete) will be added in later slices.

const BASE_URL = '/api';

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
