// src/types/supabase-v2.8.ts
// Ручні типи для виправлення зламаного автогенерованого types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// 1. Визначення ENUM-типів
export type AppRole = "user" | "admin" | "superadmin" | "developer";

// 2. Визначення типів для RPC-функцій
export type AdminUser = {
  user_id: string;
  email: string;
  app_role: AppRole;
  full_name: string | null;
};

export interface RpcFunctionDefinitions {
  get_my_role: {
    Args: Record<string, never>;
    Returns: AppRole;
  };
  admin_get_all_users: {
    Args: Record<string, never>;
    Returns: AdminUser[];
  };
  is_admin: {
    Args: Record<string, never>;
    Returns: boolean;
  };
}
