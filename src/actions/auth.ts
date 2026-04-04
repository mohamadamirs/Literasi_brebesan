// src/actions/auth.ts
import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { sql } from "../lib/db";
import { v4 as uuidv4 } from "uuid";
import { createSessionToken } from "../lib/jwt";
import bcrypt from "bcryptjs";

export const authActions = {
  signIn: defineAction({
    accept: "form",
    input: z.object({
      email: z.string().email("Format email salah, Nyet!"),
      password: z.string().min(1, "Password wajib diisi!"),
    }),
    handler: async (input, context) => {
      const { rows } = await sql`
        SELECT u.id, u.email, u.password_hash, p.role
        FROM users u
        LEFT JOIN profiles p ON u.id = p.id
        WHERE u.email = ${input.email}
      `;
      const user = rows[0];
      if (!user) throw new Error("Email atau password lu salah!");

      const isPasswordValid = await bcrypt.compare(
        input.password,
        user.password_hash,
      );
      if (!isPasswordValid) throw new Error("Email atau password lu salah!");

      const token = await createSessionToken(user.id);
      context.cookies.set("session", token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      });
      return { success: true };
    },
  }),

  register: defineAction({
    accept: "form",
    input: z.object({
      fullName: z.string().min(3, "Nama minimal 3 huruf, Nyet!"),
      email: z.string().email("Format email salah!"),
      password: z.string().min(6, "Password minimal 6 karakter!"),
    }),
    handler: async (input, context) => {
      const { rows: existingUser } =
        await sql`SELECT id FROM users WHERE email = ${input.email}`;
      if (existingUser.length > 0)
        throw new Error("Email udah kepake, pake email lain!");

      const userId = uuidv4();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(input.password, salt);

      await sql`INSERT INTO users (id, email, password_hash) VALUES (${userId}, ${input.email}, ${hashedPassword})`;
      await sql`INSERT INTO profiles (id, full_name, role) VALUES (${userId}, ${input.fullName}, 'user')`;

      const token = await createSessionToken(userId);
      context.cookies.set("session", token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
      });
      return { success: true };
    },
  }),
};
