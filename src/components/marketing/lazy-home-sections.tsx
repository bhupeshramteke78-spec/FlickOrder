"use client";

import dynamic from "next/dynamic";

const AboutSection = dynamic(() => import("@/components/marketing/about-section").then((mod) => mod.AboutSection), {
  loading: () => <SectionSkeleton eyebrow="About FlickOrder" title="Built for better dining" />,
});

const TrialSection = dynamic(() => import("@/components/marketing/trial-section").then((mod) => mod.TrialSection), {
  loading: () => <SectionSkeleton eyebrow="Restaurant trial" title="Start your 3-day trial" />,
});

export function LazyHomeSections() {
  return (
    <>
      <AboutSection />
      <TrialSection />
    </>
  );
}

function SectionSkeleton({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.045] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">{eyebrow}</p>
      <div className="mt-4 h-7 max-w-md animate-pulse rounded bg-white/10" aria-label={title} />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-white/10" />
        <div className="h-24 animate-pulse rounded-xl bg-white/10" />
        <div className="h-24 animate-pulse rounded-xl bg-white/10" />
      </div>
    </section>
  );
}
