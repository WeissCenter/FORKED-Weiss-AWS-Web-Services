import { AppRolePermissions } from "../Permissions";

export interface EditUserInput {
  username: string;
  active?: boolean;
  role?: keyof AppRolePermissions;
}
