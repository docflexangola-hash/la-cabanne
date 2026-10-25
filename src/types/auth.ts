export type AdminRole = 'admin' | 'manager';

export type StaffMember = {
  id: string;
  email: string;
  role: AdminRole;
  displayName: string;
};
