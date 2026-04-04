import { db } from '../lib/db';
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  // ... (biarkan actions auth dan posts yang sudah ada) ...

  // 1. ACTION: MENYIMPAN / MENGUBAH AGENDA
  saveAgenda: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string().optional(), // Jika ada ID, berarti Update. Jika tidak, berarti Insert (Baru).
      title: z.string().min(3, "Judul agenda minimal 3 karakter"),
      description: z.string().min(10, "Deskripsi terlalu pendek"),
      event_date: z.string(),
      event_time: z.string(),
      location: z.string(),
      wa_link: z.string().url("Format link WhatsApp tidak valid"),
      status: z.enum(['draft', 'published', 'scheduled']),
      publish_at: z.string().optional().nullable(),
    }),
    handler: async (input, context) => {
      // Proteksi Akses Khusus Admin
      const { user } = context.locals;
      if (!user || user.role !== 'admin') {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Akses ditolak. Hanya admin yang diizinkan mengelola agenda.',
        });
      }

      // --- LOGIKA STATUS & PUBLISH_AT ---
      let publishTime = null;

      if (input.status === 'scheduled') {
        // Jika dijadwalkan, pastikan admin mengisi tanggal rilis
        if (!input.publish_at) {
          throw new ActionError({
            code: 'BAD_REQUEST',
            message: 'Tanggal rilis harus diisi jika status agenda dijadwalkan (scheduled).',
          });
        }
        publishTime = input.publish_at;
      } else if (input.status === 'published') {
        // Jika langsung di-publish, set waktu rilis ke waktu saat tombol ditekan
        publishTime = new Date().toISOString();
      }
      // Jika draft, publishTime tetap null.

      try {
        if (input.id) {
          // PROSES UPDATE DATA EKSISTING
          await db.query(
            `UPDATE agendas
             SET title = $1, description = $2, event_date = $3, event_time = $4,
                 location = $5, wa_link = $6, status = $7, publish_at = $8
             WHERE id = $9`,
            [
              input.title, input.description, input.event_date, input.event_time,
              input.location, input.wa_link, input.status, publishTime, input.id
            ]
          );
          return { success: true, message: 'Agenda berhasil diperbarui' };
        } else {
          // PROSES INSERT DATA BARU
          await db.query(
            `INSERT INTO agendas (title, description, event_date, event_time, location, wa_link, status, publish_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              input.title, input.description, input.event_date, input.event_time,
              input.location, input.wa_link, input.status, publishTime
            ]
          );
          return { success: true, message: 'Agenda baru berhasil disimpan' };
        }
      } catch (error) {
        console.error("Gagal memproses agenda:", error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Terjadi kesalahan pada database saat menyimpan agenda.',
        });
      }
    },
  }),

  // 2. ACTION: MENGHAPUS AGENDA
  deleteAgenda: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string(),
    }),
    handler: async ({ id }, context) => {
      // Proteksi Akses
      const { user } = context.locals;
      if (!user || user.role !== 'admin') {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Akses ditolak.',
        });
      }

      try {
        await db.query('DELETE FROM agendas WHERE id = $1', [id]);
        return { success: true, message: 'Agenda berhasil dihapus secara permanen' };
      } catch (error) {
        console.error("Gagal menghapus agenda:", error);
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Gagal menghapus agenda dari sistem.',
        });
      }
    }
  })
};