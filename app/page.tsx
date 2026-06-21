import { redirect } from "next/navigation";
import { getSessionDelegate } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const delegate = await getSessionDelegate();
  redirect(delegate ? "/schedule" : "/login");
}
