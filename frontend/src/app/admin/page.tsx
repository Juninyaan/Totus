import { Suspense } from "react";

import { FithubWorkspace } from "@/components/app/FithubWorkspace";

export default function AdminPage() {
  return <Suspense fallback={null}><FithubWorkspace section="admin" /></Suspense>;
}
