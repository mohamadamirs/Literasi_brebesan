// src/types/database.ts

export type PublicationStatus = "draft" | "pending" | "published" | "archived";
export type UserRole = "user" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

export interface Publication {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  featured_image: string | null;
  author_id: string;
  category_id: number | null;
  status: PublicationStatus;
  reading_time: number;
  metadata: Record<string, any>;
  published_at: string | null;
  created_at: string;
  updated_at: string;

  // Relasi (Opsional saat query JOIN)
  profiles?: Profile;
  categories?: Category;
}
