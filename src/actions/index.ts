// src/actions/index.ts
import { authActions } from "./auth";
import { postActions } from "./posts";

export const server = {
  ...authActions,
  ...postActions,
};
