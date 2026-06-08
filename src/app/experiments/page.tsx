import SavedExperimentsClient from "@/components/experiments/SavedExperimentsClient";

// No wrapper here — SavedExperimentsClient renders inside PageShell which already includes SiteNav.
// Adding a second nav/wrapper here was what caused the double-navbar bug.
export default function ExperimentsPage() {
  return <SavedExperimentsClient />;
}
