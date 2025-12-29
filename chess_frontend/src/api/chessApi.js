import { apiRequest } from './client';

// PUBLIC_INTERFACE
export const chessApi = {
  /** Users */
  createUser: (username) => apiRequest('/users', { method: 'POST', body: { username } }),
  getUser: (userId) => apiRequest(`/users/${encodeURIComponent(userId)}`),

  /** Games */
  createGame: ({ white_user_id = null, black_user_id = null } = {}) =>
    apiRequest('/games', { method: 'POST', body: { white_user_id, black_user_id } }),

  listGames: ({ userId } = {}) => apiRequest('/games', { query: { userId } }),

  getGame: (gameId) => apiRequest(`/games/${encodeURIComponent(gameId)}`),

  submitMove: (gameId, { uci = null, san = null } = {}) =>
    apiRequest(`/games/${encodeURIComponent(gameId)}/moves`, { method: 'POST', body: { uci, san } }),

  saveSnapshot: (gameId, { name = 'latest' } = {}) =>
    apiRequest(`/games/${encodeURIComponent(gameId)}/save`, { method: 'POST', body: { name } }),

  loadSnapshot: (gameId, { name = 'latest' } = {}) =>
    apiRequest(`/games/${encodeURIComponent(gameId)}/load`, { method: 'POST', body: { name } }),
};
