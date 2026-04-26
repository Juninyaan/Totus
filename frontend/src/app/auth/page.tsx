import { Suspense } from "react";

import { FithubWorkspace } from "@/components/app/FithubWorkspace";

export default function AuthPage() {
  return <Suspense fallback={null}><FithubWorkspace section="auth" /></Suspense>;
}
