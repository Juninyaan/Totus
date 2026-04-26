import { Suspense } from "react";

import { FithubWorkspace } from "@/components/app/FithubWorkspace";

export default function DiscoverPage() {
  return <Suspense fallback={null}><FithubWorkspace section="discover" /></Suspense>;
}
