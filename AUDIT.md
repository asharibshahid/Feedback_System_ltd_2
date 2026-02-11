<!--
1. App Router still retains /admin/visitors + /admin/settings folders plus their own layout; conflicts with the single-page Command Center mandate.
2. Duplicate nested layouts scatter providers and background styles; root layout should host fonts/background before page-specific views.
3. Globals.css lacks the glassmorphic palette and overflow handling required for the full-screen, no-scroll dashboard canvas.
4. Components folder structure is mostly correct yet could be trimmed to the core layout/dashboard/charts/ui buckets without extra nested routes.
5. Existing mock data + widgets need reorganized to power the new KPI + chart + streaming experience.
-->
