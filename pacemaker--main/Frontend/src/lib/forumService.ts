// Shared service for managing Discourse Forum Integration settings and synced users

export interface ForumSettings {
  discourseUrl: string;
  ssoSecretKey: string;
  ssoEnabled: boolean;
}

export interface SyncedUser {
  email: string;
  fullName: string;
  username: string;
  role: string;
  syncedAt: string;
}

const SETTINGS_KEY = 'lms_forum_settings';
const USERS_KEY = 'lms_forum_users';

const DEFAULT_SETTINGS: ForumSettings = {
  discourseUrl: 'https://forum.pacemaker.com',
  ssoSecretKey: 'pacemaker-discourse-sso-secret-12345',
  ssoEnabled: true,
};

const isBrowser = typeof window !== 'undefined';

// Get Discourse configuration
export function getForumSettings(): ForumSettings {
  if (!isBrowser) return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  } catch (e) {
    console.error('Error reading forum settings:', e);
    return DEFAULT_SETTINGS;
  }
}

// Save Discourse configuration
export function saveForumSettings(settings: ForumSettings): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving forum settings:', e);
  }
}

// Sync user with forum (triggered on registration or manual action)
export function syncUserWithForum(
  email: string,
  fullName: string,
  username: string,
  role: string
): SyncedUser {
  const newUser: SyncedUser = {
    email,
    fullName,
    username: username || email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
    role: role || 'student',
    syncedAt: new Date().toISOString(),
  };

  if (!isBrowser) return newUser;

  try {
    const syncedUsers = getSyncedForumUsers();
    // Check if user is already synced, if so, update their record
    const index = syncedUsers.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (index >= 0) {
      syncedUsers[index] = { ...syncedUsers[index], ...newUser };
    } else {
      syncedUsers.push(newUser);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(syncedUsers));
  } catch (e) {
    console.error('Error syncing user with forum:', e);
  }

  return newUser;
}

// Get list of synced accounts
export function getSyncedForumUsers(): SyncedUser[] {
  if (!isBrowser) return [];
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading synced forum users:', e);
    return [];
  }
}

// Initialize default users if none exist (for demo purposes)
export function ensureDefaultSyncedUsers(): void {
  if (!isBrowser) return;
  try {
    const existing = localStorage.getItem(USERS_KEY);
    if (!existing) {
      const defaults: SyncedUser[] = [
        {
          email: 'admin@pacemaker.com',
          fullName: 'Super Admin',
          username: 'admin',
          role: 'admin',
          syncedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          email: 'jane.smith@pacemaker.com',
          fullName: 'Dr. Jane Smith',
          username: 'janesmith',
          role: 'instructor',
          syncedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          email: 'john.doe@pacemaker.com',
          fullName: 'John Doe',
          username: 'johndoe',
          role: 'student',
          syncedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        }
      ];
      localStorage.setItem(USERS_KEY, JSON.stringify(defaults));
    }
  } catch (e) {
    console.error('Error setting default synced users:', e);
  }
}
