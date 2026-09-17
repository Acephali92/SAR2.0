import type { Access, FieldAccess } from 'payload';

export const isAdmin: Access = ({ req }) => req.user?.role === 'admin';

export const isAdminFieldAccess: FieldAccess = ({ req }) => req.user?.role === 'admin';
