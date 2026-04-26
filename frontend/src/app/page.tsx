import { Suspense } from "react";

import { FithubWorkspace } from "@/components/app/FithubWorkspace";

export default function HomePage() {
  return <Suspense fallback={null}><FithubWorkspace section="home" /></Suspense>;
}
