import { requireRole } from "@/lib/auth";
import { geminiEnabled } from "@/lib/gemini";
import Chat from "./Chat";

export const metadata = { title: "Kopilot AI" };

export default async function KopilotPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const me = await requireRole("child");
  const mode = (await searchParams).mode === "rencana" ? "rencana" : "bicara";
  return <Chat key={mode} mode={mode} name={me.name} ai={geminiEnabled()} />;
}
