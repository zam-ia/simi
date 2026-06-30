import { redirect } from "next/navigation";
import { getSessionRedirectTarget } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  redirect(await getSessionRedirectTarget());
}
