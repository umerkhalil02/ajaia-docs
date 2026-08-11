// lib/auth.js
//
// Mock authentication. There is no password/session system -- the reviewer
// picks a seeded user from a dropdown, which sets a plain cookie
// (`ajaia_user_id`) read on every API request. This is explicitly NOT secure
// auth; it exists to demonstrate multi-user document ownership and sharing
// within the assignment's timebox. See ARCHITECTURE.md for the tradeoff.

const { cookies } = require('next/headers');

const COOKIE_NAME = 'ajaia_user_id';

function getCurrentUserId() {
  const store = cookies();
  const c = store.get(COOKIE_NAME);
  return c ? c.value : null;
}

module.exports = { COOKIE_NAME, getCurrentUserId };
