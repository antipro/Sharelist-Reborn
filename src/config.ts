export const config = {
  // Defaults to true if not explicitly set to 'false'
  useMock: import.meta.env.VITE_USE_MOCK !== 'false',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
};