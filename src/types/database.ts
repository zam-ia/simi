import type { Client, MenuCategory, MenuItem } from "./menu";

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: Client;
        Insert: Omit<Client, "id" | "created_at" | "updated_at"> & Partial<Pick<Client, "id" | "created_at" | "updated_at">>;
        Update: Partial<Omit<Client, "id" | "created_at" | "updated_at">>;
      };
      menu_categories: {
        Row: MenuCategory;
        Insert: Omit<MenuCategory, "id" | "created_at" | "updated_at"> & Partial<Pick<MenuCategory, "id" | "created_at" | "updated_at">>;
        Update: Partial<Omit<MenuCategory, "id" | "created_at" | "updated_at">>;
      };
      menu_items: {
        Row: MenuItem;
        Insert: Omit<MenuItem, "id" | "created_at" | "updated_at"> & Partial<Pick<MenuItem, "id" | "created_at" | "updated_at">>;
        Update: Partial<Omit<MenuItem, "id" | "created_at" | "updated_at">>;
      };
    };
  };
};
