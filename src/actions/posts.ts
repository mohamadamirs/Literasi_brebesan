// src/actions/posts.ts
import { defineAction } from "astro:actions";
import { z } from "astro:schema";
import { sql } from "../lib/db";
import { v4 as uuidv4 } from "uuid";
import { generateSlug } from "../lib/utils";

export const postActions = {
  createPost: defineAction({
    accept: "form",
    input: z.object({
      title: z.string().min(5, "Judul kedikiten!"),
      content: z.string().optional(),
      status: z.enum(["draft", "pending", "published"]).default("draft"),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new Error("Login dulu!");

      let finalStatus = input.status;
      if (user.role !== "admin" && finalStatus === "published")
        finalStatus = "pending";

      const id = uuidv4();
      const slug = generateSlug(input.title);

      await sql`
        INSERT INTO posts (id, title, content, status, user_id, slug, updated_at)
        VALUES (${id}, ${input.title}, ${input.content || ""}, ${finalStatus}, ${user.id}, ${slug}, NOW())
      `;
      return { success: true };
    },
  }),

  updatePost: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().uuid(),
      title: z.string().min(5),
      content: z.string().optional(),
      status: z.enum(["draft", "pending", "published"]),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new Error("Gak ada akses!");

      const newSlug = generateSlug(input.title);

      if (user.role === "admin") {
        await sql`UPDATE posts SET title = ${input.title}, content = ${input.content}, status = ${input.status}, slug = ${newSlug}, updated_at = NOW() WHERE id = ${input.id}`;
      } else {
        const finalStatus =
          input.status === "published" ? "pending" : input.status;
        await sql`UPDATE posts SET title = ${input.title}, content = ${input.content}, status = ${finalStatus}, slug = ${newSlug}, updated_at = NOW() WHERE id = ${input.id} AND user_id = ${user.id}`;
      }
      return { success: true };
    },
  }),

  deletePost: defineAction({
    accept: "form",
    input: z.object({ id: z.string().uuid() }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) throw new Error("Gak ada akses!");

      if (user.role === "admin") {
        await sql`DELETE FROM posts WHERE id = ${input.id}`;
      } else {
        await sql`DELETE FROM posts WHERE id = ${input.id} AND user_id = ${user.id}`;
      }
      return { success: true };
    },
  }),

  approvePost: defineAction({
    accept: "form",
    input: z.object({ id: z.string().uuid() }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user || user.role !== "admin")
        throw new Error("Lu bukan bos, dilarang nge-ACC!");

      await sql`UPDATE posts SET status = 'published', updated_at = NOW() WHERE id = ${input.id}`;
      return { success: true };
    },
  }),
};
