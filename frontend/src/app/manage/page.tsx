import { Suspense } from "react";

import { FithubWorkspace } from "@/components/app/FithubWorkspace";

export default function ManagePage() {
  return <Suspense fallback={null}><FithubWorkspace section="manage" /></Suspense>;
}
