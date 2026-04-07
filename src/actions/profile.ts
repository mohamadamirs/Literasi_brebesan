import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { sql } from "../lib/db";

export const profileActions = {
  updateProfile: defineAction({
    accept: "form",
    input: z.object({
      fullName: z.string().min(3, "Nama minimal 3 karakter."),
      bio: z.string().max(200, "Bio maksimal 200 karakter.").optional().nullable(),
      instagram: z.string().optional().nullable(),
    }),
    handler: async (input, context) => {
      const user = context.locals.user;
      if (!user) {
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "Anda harus login untuk memperbarui profil.",
        });
      }

      try {
        await sql`
          UPDATE profiles 
          SET 
            full_name = ${input.fullName}, 
            bio = ${input.bio || null}, 
            instagram = ${input.instagram || null}
          WHERE id = ${user.id}
        `;
        return { success: true };
      } catch (e: any) {
        console.error("Update profile error:", e);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui profil.",
        });
      }
    },
  }),
};
