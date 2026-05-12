import type { Database } from './database';

/**
 * Discriminated role pulled from profiles.role check constraint.
 * Single source of truth — both server (viewer) and client (AuthContext) import.
 */
export type UserRole = Database['public']['Tables']['profiles']['Row']['role'];
