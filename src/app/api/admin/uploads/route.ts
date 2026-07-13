import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizeFileName, validateImageFile } from "@/lib/storage";

export const runtime = "nodejs";

function normalizeStoragePath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const segments = value.split("/").filter(Boolean);
  if (segments.length < 2 || segments.length > 5) return null;
  if (!segments.every((segment) => /^[a-zA-Z0-9_-]+$/.test(segment))) return null;
  return segments.join("/");
}

function canUploadToPath(context: NonNullable<Awaited<ReturnType<typeof getAdminContext>>>, storagePath: string) {
  const [root, clientId] = storagePath.split("/");

  if (context.role === "super_admin") {
    return root === "clients" || root === "blog";
  }

  return root === "clients" && Boolean(context.client?.id) && clientId === context.client?.id;
}

export async function POST(request: NextRequest) {
  const context = await getAdminContext();
  if (!context) return NextResponse.json({ error: "Tu sesion vencio. Ingresa nuevamente antes de subir la imagen." }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const storagePath = normalizeStoragePath(formData.get("storagePath"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Selecciona una imagen valida." }, { status: 400 });
    }

    const validationError = validateImageFile(file);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    if (!storagePath) return NextResponse.json({ error: "La carpeta de destino no es valida." }, { status: 400 });
    if (!canUploadToPath(context, storagePath)) return NextResponse.json({ error: "No tienes permiso para cargar imagenes en este negocio." }, { status: 403 });

    const supabase = createSupabaseAdminClient();
    const filePath = `${storagePath}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage.from("menu-images").upload(filePath, file, {
      upsert: false,
      cacheControl: "31536000",
      contentType: file.type
    });

    if (error) {
      console.error("No se pudo subir una imagen administrativa", { code: "storage_upload_failed", message: error.message });
      return NextResponse.json({ error: "Supabase rechazo la imagen. Intenta nuevamente o revisa el estado de Storage." }, { status: 502 });
    }

    const { data } = supabase.storage.from("menu-images").getPublicUrl(filePath);
    return NextResponse.json({ ok: true, url: data.publicUrl });
  } catch (error) {
    console.error("Error procesando imagen administrativa", error);
    return NextResponse.json({ error: "No se pudo procesar la imagen. Vuelve a intentarlo." }, { status: 500 });
  }
}
