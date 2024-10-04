// import { iam } from '@pulumi/aws/types/input';

// List the roles that are available in the application
export type AppRole = string;

// const roles = ['Reader', 'Editor', 'Manager', 'Admin'] as const;
// export type AppRole = typeof roles[number];

// List the objects that can be accessed in the application
export type PermissionObject =
  | 'Data Sources'
  | 'Data Views'
  | 'Report Templates'
  | 'Reports'
  | 'Glossary'
  | 'Users'
  | 'Tool Settings'
  | 'Default';

// List the actions that can be performed on the objects
export type PermissionAction = 'Read' | 'Write' | 'Approve';

type AllAppPermissions = {
  [key in PermissionObject]: PermissionAction[];
};

export type AppPermissions = Partial<AllAppPermissions>;

// export type PermissionMatrix = {
//   [key in PermissionObject]?: {
//     [key in PermissionAction]?: iam.GetPolicyDocumentStatement[];
//   };
// };

export type AppRolePermissions = {
  [key in AppRole]: {
    description: string;
    permissions: AppPermissions;
  };
};

// Define the permissions for each role
export const appRolePermissions: AppRolePermissions = {
  Reader: {
    description: 'Adapt Reader',
    permissions: {
      'Data Sources': ['Read'],
      'Data Views': ['Read'],
      'Report Templates': ['Read'],
      Reports: ['Read'],
      Glossary: ['Read'],
      Default: ['Read', 'Write'],
    },
  },
  Editor: {
    description: 'Adapt Editor',
    permissions: {
      'Data Sources': ['Read', 'Write'],
      'Data Views': ['Read', 'Write'],
      'Report Templates': ['Read', 'Write'],
      Reports: ['Read', 'Write'],
      Glossary: ['Read', 'Write'],
      Default: ['Read', 'Write'],
    },
  },
  Manager: {
    description: 'Adapt Manager',
    permissions: {
      'Data Sources': ['Read', 'Write'],
      'Data Views': ['Read', 'Write'],
      'Report Templates': ['Read', 'Write'],
      Reports: ['Read', 'Write', 'Approve'],
      Glossary: ['Read', 'Write', 'Approve'],
      Users: ['Read'],
      'Tool Settings': ['Read', 'Write'],
      Default: ['Read', 'Write'],
    },
  },
  Admin: {
    description: 'Adapt Admin',
    permissions: {
      'Data Sources': ['Read', 'Write'],
      'Data Views': ['Read', 'Write'],
      'Report Templates': ['Read', 'Write'],
      Reports: ['Read'],
      Glossary: ['Read', 'Write'],
      Users: ['Read', 'Write'],
      'Tool Settings': ['Read', 'Write'],
      Default: ['Read', 'Write'],
    },
  },
  SuperAdmin: {
    description: 'Adapt Super Admin',
    permissions: {
      'Data Sources': ['Read', 'Write'],
      'Data Views': ['Read', 'Write'],
      'Report Templates': ['Read', 'Write'],
      Reports: ['Read', 'Write', 'Approve'],
      Glossary: ['Read', 'Write', 'Approve'],
      Users: ['Read', 'Write'],
      'Tool Settings': ['Read', 'Write'],
      Default: ['Read', 'Write'],
    },
  },
};
