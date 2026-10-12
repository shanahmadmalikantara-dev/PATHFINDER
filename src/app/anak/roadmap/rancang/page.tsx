import { requireRole } from "@/lib/auth";
import { geminiEnabled } from "@/lib/gemini";
import Planner from "./Planner";

export const metadata = { title: "Rancang dengan AI" };

export default async function RancangPage() {
  const me = await requireRole("child");
  return <Planner name={me.name} grade={me.grade} ai={geminiEnabled()} />;
}
