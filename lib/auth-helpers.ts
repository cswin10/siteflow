import { createClient as createServerClient } from '@/lib/supabase/server';
import type { Profile, UserRole } from '@/types';

export async function getCurrentUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function getUserRole(): Promise<UserRole | null> {
  const profile = await getCurrentUser();
  return profile?.role || null;
}

export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin';
}

export async function isSiteManager(): Promise<boolean> {
  const role = await getUserRole();
  return role === 'admin' || role === 'site_manager';
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}
