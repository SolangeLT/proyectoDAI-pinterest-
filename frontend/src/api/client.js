const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080";
const POSTS_CACHE_KEY = "mosaico.posts.cache";
const POSTS_SYNC_KEY = "mosaico.posts.syncedAt";
const CURRENT_USER_KEY = "mosaico.currentUser";

export function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem(CURRENT_USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (!user) {
    sessionStorage.removeItem(CURRENT_USER_KEY);
  } else {
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
  window.dispatchEvent(new Event("current-user-updated"));
}

export function readCachedPosts() {
  try {
    return JSON.parse(localStorage.getItem(POSTS_CACHE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function readSyncTimestamp() {
  return localStorage.getItem(POSTS_SYNC_KEY) || "";
}

export function writePostCache(posts) {
  localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(posts));
  localStorage.setItem(POSTS_SYNC_KEY, new Date().toISOString());
}

export function removePostFromCache(postId) {
  const nextPosts = readCachedPosts().filter((post) => post.id !== postId);
  writePostCache(nextPosts);
}

export function mergePostCache(updatedPosts) {
  const byId = new Map(readCachedPosts().map((post) => [post.id, post]));
  updatedPosts.forEach((post) => byId.set(post.id, post));
  const merged = Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  writePostCache(merged);
  return merged;
}

function buildUrl(path, params = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };

  const currentUser = getCurrentUser();
  if (currentUser?.id) {
    headers["X-User"] = currentUser.id;
  }

  const response = await fetch(path.startsWith("http") ? path : `${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const error = await response.json();
      message = error.detail || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const postsApi = {
  listPosts({ page = 1, limit = 12, minDate } = {}) {
    return apiFetch(buildUrl("/posts", { page, limit, min_date: minDate }));
  },
  getPost(id) {
    return apiFetch(`/posts/${id}`);
  },
  createPost(payload) {
    return apiFetch("/posts", { method: "POST", body: payload });
  },
  patchPost(id, payload) {
    return apiFetch(`/posts/${id}`, { method: "PATCH", body: payload });
  },
  replacePost(id, payload) {
    return apiFetch(`/posts/${id}`, { method: "PUT", body: payload });
  },
  deletePost(id) {
    return apiFetch(`/posts/${id}`, { method: "DELETE" });
  },
  discover(count = 12) {
    return apiFetch(buildUrl("/discover", { count }));
  },
};

export const usersApi = {
  listUsers() {
    return apiFetch("/users");
  },
  createUser(payload) {
    return apiFetch("/users", { method: "POST", body: payload });
  },
};
