import { Suspense } from "react";

import TestimonialClient from "./TestimonialClient";

export default function TestimonialPage() {
  return (
    // ADDED: Suspense wrapper for client-only testimonial component
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--bm-bg)]" />}>
      <TestimonialClient />
    </Suspense>
  );
}
