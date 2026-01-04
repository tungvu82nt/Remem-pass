
export type Page = 
  | 'login' 
  | 'register' 
  | 'forgot-password' 
  | 'confirm-email' 
  | 'dashboard' 
  | 'settings' 
  | 'security' 
  | 'notifications'
  | 'all-items'
  | 'favorites'
  | 'generator'
  | 'audit';

export type ItemType = 'login' | 'card' | 'note';

export interface VaultItem {
  id: string;
  type: ItemType;
  name: string;
  username?: string;
  password?: string;
  url?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  note?: string;
  favorite: boolean;
  lastUsed: string;
  strength?: number; // 0-100
}

export interface User {
  name: string;
  email: string;
  avatar: string;
  plan: 'Free' | 'Pro';
}

export interface Activity {
  id: string;
  name: string;
  username: string;
  lastUsed: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'security' | 'system' | 'info' | 'success';
  unread: boolean;
  action?: string;
}
