"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { CAPABILITIES } from "@/lib/constants";

const refresh = () => revalidatePath("/", "layout");

export async function setCapability(cap: string) {
  const me = await requireRole("parent");
  if (!CAPABILITIES.some((c) => c.value === cap)) return;
  db.prepare("UPDATE users SET capability = ? WHERE id = ?").run(cap, me.id);
  refresh();
}
