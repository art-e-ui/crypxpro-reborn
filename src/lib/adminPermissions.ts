import { supabase } from "@/integrations/supabase/client";

export interface PagePermissions {
  dashboard: boolean;
  users: boolean;
  'financial-status': boolean;
  'deposit-requests': boolean;
  withdrawals: boolean;
  futures: boolean;
  'sample-tokens': boolean;
  kyc: boolean;
  wallets: boolean;
  'customer-service': boolean;
  support: boolean;
  administrator: boolean;
}

export interface UserPermissionConfig {
  email: string;
  isAdmin: boolean;
  permissions: PagePermissions;
}

export interface CustomAccount {
  id: string;
  customId: string; // e.g., 'CXPAD-001' or 'CXPST-001'
  email: string;
  username: string;
  role: 'admin' | 'staff';
  password?: string;
  createdAt: string;
  permissions: PagePermissions;
  createdByAdminId?: string; // Links staff members to the creator Admin
}

const STORAGE_KEY = 'admin_portal_permissions_v2';
const CUSTOM_ACCOUNTS_KEY = 'crypx_custom_accounts_v1';

export const DEFAULT_PAGES: PagePermissions = {
  dashboard: true,
  users: true,
  'financial-status': true,
  'deposit-requests': true,
  withdrawals: true,
  futures: true,
  'sample-tokens': true,
  kyc: true,
  wallets: true,
  'customer-service': true,
  support: true,
  administrator: true,
};

export const DEFAULT_NO_ACCESS_PAGES: PagePermissions = {
  dashboard: true,
  users: true,
  'financial-status': false,
  'deposit-requests': true,
  withdrawals: true,
  futures: true,
  'sample-tokens': true,
  kyc: true,
  wallets: false,
  'customer-service': false,
  support: true,
  administrator: false,
};

export const PRIMARY_OWNERS = [
  'heathercarpe34@gmail.com'
];

export function isPrimaryOwner(email: string | undefined): boolean {
  if (!email) return false;
  return PRIMARY_OWNERS.includes(email.toLowerCase().trim());
}

// Custom Accounts Management Core Engine
export function getCustomAccounts(): CustomAccount[] {
  const stored = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse custom accounts", e);
    return [];
  }
}

export function saveCustomAccounts(accounts: CustomAccount[]): void {
  localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(accounts));
}

// Generate sequential IDs based on role
export function getNextAdminId(accounts: CustomAccount[]): string {
  const admins = accounts.filter(a => a.role === 'admin');
  if (admins.length === 0) return 'CXPAD-001';
  
  const maxNum = admins.reduce((max, curr) => {
    const match = curr.customId.match(/CXPAD-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 0);
  
  return `CXPAD-${String(maxNum + 1).padStart(3, '0')}`;
}

export function getNextStaffId(accounts: CustomAccount[]): string {
  const staff = accounts.filter(a => a.role === 'staff');
  if (staff.length === 0) return 'CXPST-001';
  
  const maxNum = staff.reduce((max, curr) => {
    const match = curr.customId.match(/CXPST-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 0);
  
  return `CXPST-${String(maxNum + 1).padStart(3, '0')}`;
}

// Always returns up-to-date config for an email
export function getUserPermission(email: string | undefined): UserPermissionConfig {
  if (!email) {
    return {
      email: '',
      isAdmin: false,
      permissions: { ...DEFAULT_NO_ACCESS_PAGES },
    };
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Owner account override: always full power
  if (isPrimaryOwner(normalizedEmail)) {
    return {
      email: normalizedEmail,
      isAdmin: true,
      permissions: { ...DEFAULT_PAGES },
    };
  }

  // Check custom accounts (Owner/Admin created accounts)
  const customAccounts = getCustomAccounts();
  const matchedCustom = customAccounts.find(a => a.email.toLowerCase().trim() === normalizedEmail);
  if (matchedCustom) {
    return {
      email: normalizedEmail,
      isAdmin: true, // Allow layout entry (routes are protected by page permissions check)
      permissions: matchedCustom.permissions,
    };
  }

  // Fallback to legacy/browser local storage map
  const stored = localStorage.getItem(STORAGE_KEY);
  let configs: Record<string, UserPermissionConfig> = {};

  if (stored) {
    try {
      configs = JSON.parse(stored);
    } catch (e) {
      // ignore
    }
  }

  if (configs[normalizedEmail]) {
    return configs[normalizedEmail];
  }

  // Default for normal users
  return {
    email: normalizedEmail,
    isAdmin: false,
    permissions: { ...DEFAULT_NO_ACCESS_PAGES },
  };
}

export function saveUserPermission(config: UserPermissionConfig) {
  const normalizedEmail = config.email.toLowerCase().trim();
  
  // Prevent altering Owner account
  if (isPrimaryOwner(normalizedEmail)) return;

  // If this email is a custom account, save it there instead
  const customAccounts = getCustomAccounts();
  const accountIdx = customAccounts.findIndex(a => a.email.toLowerCase().trim() === normalizedEmail);
  if (accountIdx !== -1) {
    customAccounts[accountIdx].permissions = config.permissions;
    saveCustomAccounts(customAccounts);
    return;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  let configs: Record<string, UserPermissionConfig> = {};

  if (stored) {
    try {
      configs = JSON.parse(stored);
    } catch (e) {
      // ignore
    }
  }

  configs[normalizedEmail] = {
    email: normalizedEmail,
    isAdmin: config.isAdmin,
    permissions: config.permissions,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function hasPermissionToView(email: string | undefined, path: string): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();

  // Owner always has permission to everything
  if (isPrimaryOwner(normalizedEmail)) return true;

  const config = getUserPermission(normalizedEmail);
  if (!config.isAdmin) return false;

  const cleanPath = path.replace('/admin/', '').split('?')[0].split('#')[0];

  if (cleanPath === 'spot-control' || cleanPath === 'sample-tokens') {
    return config.permissions['sample-tokens'];
  }

  if (cleanPath === 'ownership') {
    // Only primary owners have ownership page access
    return isPrimaryOwner(normalizedEmail);
  }

  if (cleanPath === 'administrator') {
    // Only Owners or Admins (role: 'admin') can access the Administrator page. Staff cannot access it!
    const customAccounts = getCustomAccounts();
    const matchedCustom = customAccounts.find(a => a.email.toLowerCase().trim() === normalizedEmail);
    if (matchedCustom) {
      return matchedCustom.role === 'admin';
    }
    // Owners get checked above, so anyone else who is an admin in legacy but not in custom accounts should not see it
    return false;
  }

  if (cleanPath === 'dashboard' || cleanPath === '') {
    return config.permissions.dashboard;
  }

  const pageKey = cleanPath as keyof PagePermissions;
  if (pageKey in config.permissions) {
    return config.permissions[pageKey];
  }

  return true; // Default fallback
}

export function isUserAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  
  if (isPrimaryOwner(normalizedEmail)) {
    return true;
  }

  const config = getUserPermission(normalizedEmail);
  return config.isAdmin;
}

export async function syncAdminPermissions(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();

  // Owner account override: always full power
  if (isPrimaryOwner(normalizedEmail)) {
    const ownerConfig = {
      email: normalizedEmail,
      isAdmin: true,
      permissions: { ...DEFAULT_PAGES },
    };
    saveUserPermission(ownerConfig);
    return true;
  }

  // Force sync custom accounts and user referrals with Supabase first
  try {
    await syncCustomAccountsWithSupabase();
    await syncUserReferralsWithSupabase();
  } catch (e) {
    console.warn("Could not sync data in syncAdminPermissions:", e);
  }

  // Check if it's a custom account
  const customAccounts = getCustomAccounts();
  const matchedCustom = customAccounts.find(a => a.email.toLowerCase().trim() === normalizedEmail);
  if (matchedCustom) {
    const userConfig: UserPermissionConfig = {
      email: normalizedEmail,
      isAdmin: true,
      permissions: matchedCustom.permissions,
    };
    saveUserPermission(userConfig);
    return true;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, admin_permissions')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.warn("Could not fetch user profile for permissions sync:", error);
      return isUserAdmin(normalizedEmail);
    }

    if (data) {
      const isAdmin = !!data.is_admin;
      let permissions = { ...DEFAULT_NO_ACCESS_PAGES };

      if (data.admin_permissions) {
        try {
          permissions = typeof data.admin_permissions === 'string'
            ? JSON.parse(data.admin_permissions)
            : data.admin_permissions;
        } catch (e) {
          console.error("Failed to parse admin_permissions JSON:", e);
        }
      } else if (isAdmin) {
        permissions = { ...DEFAULT_PAGES };
      }

      const userConfig: UserPermissionConfig = {
        email: normalizedEmail,
        isAdmin,
        permissions,
      };

      saveUserPermission(userConfig);
      return isAdmin;
    }
  } catch (err) {
    console.warn("Error in syncAdminPermissions:", err);
  }
  return isUserAdmin(normalizedEmail);
}

// ==========================================
// REFERRAL SYSTEM & ADMIN GROUP MANAGEMENT
// ==========================================

export interface UserReferral {
  userEmail: string;
  userId?: string;
  referredByAdminId: string; // Admin customId, e.g. 'CXPAD-001'
  referredAt: string;
}

export interface AdminWalletConfig {
  adminId: string;
  symbol: string;
  network: string;
  address: string;
}

const REFERRALS_KEY = 'crypx_user_referrals_v2';
const ADMIN_WALLETS_KEY = 'crypx_admin_wallets_v1';

// User referrals management
export function getUserReferrals(): UserReferral[] {
  const stored = localStorage.getItem(REFERRALS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
}

export function saveUserReferrals(referrals: UserReferral[]): void {
  localStorage.setItem(REFERRALS_KEY, JSON.stringify(referrals));
}

export function getReferrerForUser(email: string | undefined, userId?: string): string | null {
  if (!email && !userId) return null;
  const referrals = getUserReferrals();
  const matched = referrals.find(r => 
    (email && r.userEmail.toLowerCase().trim() === email.toLowerCase().trim()) || 
    (userId && r.userId === userId)
  );
  return matched ? matched.referredByAdminId : null;
}

export function setReferrerForUser(email: string, userId: string | undefined, adminId: string): void {
  const referrals = getUserReferrals();
  const normEmail = email.toLowerCase().trim();
  const index = referrals.findIndex(r => r.userEmail === normEmail || (userId && r.userId === userId));
  
  const referralObj: UserReferral = {
    userEmail: normEmail,
    userId: userId || undefined,
    referredByAdminId: adminId,
    referredAt: new Date().toISOString()
  };

  if (index !== -1) {
    referrals[index] = {
      ...referrals[index],
      userId: userId || referrals[index].userId,
      referredByAdminId: adminId
    };
  } else {
    referrals.push(referralObj);
  }
  saveUserReferrals(referrals);
  
  // Call Supabase saving asynchronously
  const activeReferral = index !== -1 ? referrals[index] : referralObj;
  saveUserReferralToSupabase(activeReferral).catch(err => {
    console.warn("Failed to automatically save referral to Supabase:", err);
  });
}

// Get administrative ID for current user (returns CXPAD-xxx if admin or staff, null if owner)
export function getAdminIdForCurrentUser(email: string | undefined): string | null {
  if (!email) return null;
  const normEmail = email.toLowerCase().trim();
  if (isPrimaryOwner(normEmail)) return null;

  const customAccounts = getCustomAccounts();
  const matched = customAccounts.find(a => a.email.toLowerCase().trim() === normEmail);
  if (!matched) return null;

  if (matched.role === 'admin') {
    return matched.customId;
  } else if (matched.role === 'staff') {
    return matched.createdByAdminId || null;
  }
  return null;
}

// Filter lists of data based on the active admin's group
export function filterUsersByAdminGroup<T extends { id?: string; user_id?: string; email?: string }>(
  items: T[], 
  currentAdminId: string | null
): T[] {
  if (!currentAdminId) return items; // Owners get all items
  
  return items.filter(item => {
    // Determine the user identifier
    const email = item.email;
    const userId = item.user_id || item.id;
    const referrer = getReferrerForUser(email, userId);
    return referrer === currentAdminId;
  });
}

// Admin-specific wallets management
export function getAdminWallets(adminId?: string): AdminWalletConfig[] {
  const stored = localStorage.getItem(ADMIN_WALLETS_KEY);
  let wallets: AdminWalletConfig[] = [];
  if (stored) {
    try {
      wallets = JSON.parse(stored);
    } catch (e) {
      console.warn("Failed to parse admin wallets:", e);
    }
  }
  if (adminId) {
    return wallets.filter(w => w.adminId === adminId);
  }
  return wallets;
}

export function saveAdminWallets(wallets: AdminWalletConfig[]): void {
  localStorage.setItem(ADMIN_WALLETS_KEY, JSON.stringify(wallets));
}

export function getAdminWalletAddress(adminId: string, symbol: string, network: string): string | null {
  const wallets = getAdminWallets();
  const matched = wallets.find(w => 
    w.adminId === adminId && 
    w.symbol.toUpperCase() === symbol.toUpperCase() && 
    w.network.toUpperCase() === network.toUpperCase()
  );
  return matched ? matched.address : null;
}

// ==========================================
// SUPABASE REAL DATABASE SYNC LAYER
// ==========================================

export async function syncCustomAccountsWithSupabase(): Promise<CustomAccount[]> {
  try {
    // Try the RPC which bypasses RLS for pre-login fetching
    let result = await supabase.rpc('get_all_custom_accounts');
    
    // Fallback to normal select if RPC doesn't exist yet
    if (result.error) {
      result = await supabase.from('custom_accounts').select('*');
    }

    const { data, error } = result;

    if (error) {
      console.warn("Could not load custom accounts from real Supabase, using local fallback.", error);
      return getCustomAccounts();
    }
    
    if (data && data.length > 0) {
      const dbAccounts: CustomAccount[] = data.map((row: any) => ({
        id: row.id,
        customId: row.custom_id,
        email: row.email,
        username: row.username,
        role: row.role as 'admin' | 'staff',
        password: row.password || undefined,
        createdAt: row.created_at || new Date().toISOString(),
        permissions: (typeof row.permissions === 'object' && row.permissions) ? row.permissions : { ...DEFAULT_PAGES },
        createdByAdminId: row.created_by_admin_id || undefined
      }));
      
      const local = getCustomAccounts();
      const merged = [...local];
      
      dbAccounts.forEach(dbAcc => {
        const idx = merged.findIndex(l => l.email.toLowerCase().trim() === dbAcc.email.toLowerCase().trim());
        if (idx !== -1) {
          merged[idx] = dbAcc;
        } else {
          merged.push(dbAcc);
        }
      });
      
      saveCustomAccounts(merged);
      return merged;
    }
  } catch (err) {
    console.warn("Supabase custom accounts sync exception:", err);
  }
  return getCustomAccounts();
}

export async function saveCustomAccountToSupabase(account: CustomAccount): Promise<void> {
  try {
    // Try to create an actual Supabase Auth user via our new RPC
    const { error: rpcError } = await supabase.rpc('create_custom_admin', {
      p_email: account.email,
      p_password: account.password,
      p_username: account.username,
      p_custom_id: account.customId,
      p_role: account.role,
      p_permissions: account.permissions
    });

    if (rpcError) {
      console.warn("Failed to create custom admin via RPC. Ensure setup_admin_auth.sql was executed. Fallback to direct upsert.", rpcError);
      
      // Fallback
      const dbPayload = {
        id: account.id,
        custom_id: account.customId,
        email: account.email,
        username: account.username,
        role: account.role,
        password: account.password || null,
        created_by_admin_id: account.createdByAdminId || null,
        permissions: account.permissions
      };
      
      const { error } = await supabase.from('custom_accounts').upsert(dbPayload, { onConflict: 'email' });
      if (error) {
        console.warn("Failed to upsert custom account to Supabase:", error);
      }
    }
  } catch (err) {
    console.warn("Supabase custom accounts save exception:", err);
  }
}

export async function deleteCustomAccountFromSupabase(email: string): Promise<void> {
  try {
    const { error: rpcError } = await supabase.rpc('delete_custom_admin', { p_email: email });
    
    if (rpcError) {
      console.warn("Failed to delete custom admin via RPC. Fallback to direct delete.", rpcError);
      const { error } = await supabase.from('custom_accounts').delete().eq('email', email);
      if (error) {
        console.warn("Failed to delete custom account from Supabase:", error);
      }
    }
  } catch (err) {
    console.warn("Supabase custom accounts delete exception:", err);
  }
}

export async function syncUserReferralsWithSupabase(): Promise<UserReferral[]> {
  try {
    const { data, error } = await supabase.from('user_referrals').select('*');
    if (error) {
      console.warn("Could not load user referrals from Supabase, using local fallback.", error);
      return getUserReferrals();
    }
    
    if (data && data.length > 0) {
      const dbReferrals: UserReferral[] = data.map((row: any) => ({
        userEmail: row.user_email,
        userId: row.user_id || undefined,
        referredByAdminId: row.referred_by_admin_id,
        referredAt: row.referred_at || new Date().toISOString()
      }));
      
      const local = getUserReferrals();
      const merged = [...local];
      
      dbReferrals.forEach(dbRef => {
        const idx = merged.findIndex(l => l.userEmail.toLowerCase().trim() === dbRef.userEmail.toLowerCase().trim());
        if (idx !== -1) {
          merged[idx] = dbRef;
        } else {
          merged.push(dbRef);
        }
      });
      
      saveUserReferrals(merged);
      return merged;
    }
  } catch (err) {
    console.warn("Supabase user referrals sync exception:", err);
  }
  return getUserReferrals();
}

export async function saveUserReferralToSupabase(referral: UserReferral): Promise<void> {
  try {
    const dbPayload = {
      user_email: referral.userEmail.toLowerCase().trim(),
      user_id: referral.userId || null,
      referred_by_admin_id: referral.referredByAdminId
    };
    
    const { error } = await supabase.from('user_referrals').upsert(dbPayload, { onConflict: 'user_email' });
    if (error) {
      console.warn("Failed to upsert user referral to Supabase:", error);
    }
  } catch (err) {
    console.warn("Supabase user referrals save exception:", err);
  }
}

export async function syncAdminWalletsWithSupabase(): Promise<AdminWalletConfig[]> {
  try {
    const { data, error } = await supabase.from('admin_wallet_configs').select('*');
    if (error) {
      console.warn("Could not load admin wallet configs from Supabase, using local fallback.", error);
      return getAdminWallets();
    }
    
    if (data && data.length > 0) {
      const dbWallets: AdminWalletConfig[] = data.map((row: any) => ({
        adminId: row.admin_id,
        symbol: row.symbol,
        network: row.network,
        address: row.address
      }));
      
      const local = getAdminWallets();
      const merged = [...local];
      
      dbWallets.forEach(dbW => {
        const idx = merged.findIndex(l => 
          l.adminId === dbW.adminId && 
          l.symbol.toUpperCase() === dbW.symbol.toUpperCase() && 
          l.network.toUpperCase() === dbW.network.toUpperCase()
        );
        if (idx !== -1) {
          merged[idx] = dbW;
        } else {
          merged.push(dbW);
        }
      });
      
      saveAdminWallets(merged);
      return merged;
    }
  } catch (err) {
    console.warn("Supabase admin wallets sync exception:", err);
  }
  return getAdminWallets();
}

export async function saveAdminWalletToSupabase(wallet: AdminWalletConfig): Promise<void> {
  try {
    const dbPayload = {
      admin_id: wallet.adminId,
      symbol: wallet.symbol.toUpperCase(),
      network: wallet.network.toUpperCase(),
      address: wallet.address
    };
    
    const { error } = await supabase.from('admin_wallet_configs').upsert(dbPayload, { onConflict: 'admin_id,symbol,network' });
    if (error) {
      console.warn("Failed to upsert admin wallet config to Supabase:", error);
    }
  } catch (err) {
    console.warn("Supabase admin wallet save exception:", err);
  }
}

export async function deleteAdminWalletFromSupabase(adminId: string, symbol: string, network: string): Promise<void> {
  try {
    const { error } = await supabase.from('admin_wallet_configs')
      .delete()
      .eq('admin_id', adminId)
      .eq('symbol', symbol.toUpperCase())
      .eq('network', network.toUpperCase());
    if (error) {
      console.warn("Failed to delete admin wallet from Supabase:", error);
    }
  } catch (err) {
    console.warn("Supabase admin wallet delete exception:", err);
  }
}

