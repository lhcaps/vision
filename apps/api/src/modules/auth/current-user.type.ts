export type UserRole = 'ADMIN' | 'OFFICIAL' | 'VIEWER';

export interface PublicUser {
  id: string;
  username: string | null;
  fullName: string;
  positionTitle: string | null;
  rankTitle: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
  agencyId: string | null;
  agencyName: string | null;
  agencyCode: string | null;
  isActive: boolean;
}

export type CurrentUser = PublicUser;
