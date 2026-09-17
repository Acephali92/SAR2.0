import type { Access } from 'payload';

export const isRedaktionOrAdmin: Access = ({ req }) =>
  req.user?.role === 'redaktion' || req.user?.role === 'admin';
