import { Suspense } from "react";
import { cookies } from "next/headers";
import { AppShell } from "@/components/AppShell";
import { readStoredInitialSidebarWidth } from "@/lib/panel-layout";

export default async function Home() {
  const cookieStore = await cookies();
  const initialSidebarWidth = readStoredInitialSidebarWidth(cookieStore.get("pi-sidebar-width")?.value ?? null);

  return (
    <Suspense>
      <AppShell initialSidebarWidth={initialSidebarWidth} />
    </Suspense>
  );
}
