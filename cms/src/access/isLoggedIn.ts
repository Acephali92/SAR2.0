import type { Access } from 'payload';

export const isLoggedIn: Access = ({ req }) => !!req.user;
