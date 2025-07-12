// Token blacklist management
const tokenBlacklist = new Set();

const addToBlacklist = (token) => {
  tokenBlacklist.add(token);
  
  // Clean up expired tokens from blacklist after 1 hour
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, 60 * 60 * 1000); // Same as JWT expiry time
};

const isBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

const clearBlacklist = () => {
  tokenBlacklist.clear();
};

module.exports = {
  addToBlacklist,
  isBlacklisted,
  clearBlacklist
}; 