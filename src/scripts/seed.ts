import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Completa NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local antes de ejecutar el seed.");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  const whatsapp = process.env.DEFAULT_WHATSAPP_NUMBER || "+51987088359";

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .upsert(
      {
        name: "Pollería El Sabor",
        slug: "demo-polleria",
        whatsapp_number: whatsapp,
        yape_number: whatsapp.replace(/\D/g, "").slice(-9),
        primary_color: "#0071E3",
        address: "Av. Principal 123, Huancayo",
        is_active: true
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (clientError || !client) throw clientError || new Error("No se pudo crear el cliente demo.");

  const categoryNames = ["Pollos", "Combos", "Bebidas"];
  const categoryRows = categoryNames.map((name, index) => ({
    client_id: client.id,
    name,
    display_order: index + 1,
    is_active: true
  }));

  await supabase.from("menu_categories").delete().eq("client_id", client.id);
  const { data: categories, error: categoryError } = await supabase.from("menu_categories").insert(categoryRows).select("*");
  if (categoryError || !categories) throw categoryError || new Error("No se pudieron crear las categorías demo.");

  const categoryByName = new Map(categories.map((category) => [category.name, category.id]));
  const items = [
    ["Pollos", "1/4 Pollo a la brasa", 12],
    ["Pollos", "1/2 Pollo a la brasa", 22],
    ["Pollos", "Pollo entero", 42],
    ["Combos", "Combo personal", 18],
    ["Combos", "Combo familiar", 55],
    ["Combos", "Combo parrillero", 68],
    ["Bebidas", "Gaseosa personal", 4],
    ["Bebidas", "Gaseosa 1.5L", 9],
    ["Bebidas", "Chicha morada", 6]
  ].map(([categoryName, name, price], index) => ({
    client_id: client.id,
    category_id: categoryByName.get(String(categoryName))!,
    name: String(name),
    description: "Producto demo para validar la carta digital.",
    price: Number(price),
    is_available: true,
    display_order: index + 1
  }));

  const { error: itemError } = await supabase.from("menu_items").insert(items);
  if (itemError) throw itemError;

  console.log("Seed completado. Menú demo: /menu/demo-polleria");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
