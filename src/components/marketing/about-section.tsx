import Image from "next/image";
import { Sparkles, Check, Flame } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="relative mt-20 rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-16 text-white sm:px-10 lg:py-24 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
      {/* Ambient Sunset Glow Behind About Card */}
      <div 
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent blur-3xl"
        aria-hidden="true"
      />
      <div 
        className="pointer-events-none absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-gradient-to-tr from-rose-500/15 via-orange-500/10 to-transparent blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Eyebrow Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>About KhaoScan</span>
        </div>

        {/* 2-Column Storytelling Grid */}
        <div className="mt-8 grid gap-12 lg:grid-cols-2 lg:items-start">
          {/* Left Column: Heading & Value Prop Card */}
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.12]">
              Smart Dining Solutions Designed to{" "}
              <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                Drive Your Success.
              </span>
            </h2>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-zinc-300 max-w-xl">
              We empower restaurants, cafes, and food courts with smart digital tools to eliminate ordering bottlenecks, accelerate table turnaround, and accept direct payments with zero commissions.
            </p>

            {/* Micro Highlight Card */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex items-center gap-4 backdrop-blur-md shadow-lg">
              <Image
                width={48}
                height={48}
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
                alt="Restaurant Owner"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-orange-500/40"
              />
              <div>
                <p className="text-sm font-bold text-white flex items-center gap-1.5">
                  Everything a modern restaurant needs <Flame className="h-3.5 w-3.5 text-orange-400" />
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Manage menus, live orders, payments, and staff in one unified dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Why KhaoScan & Testimonial Box */}
          <div className="lg:pl-6">
            <h3 className="text-2xl font-bold text-white">
              Why KhaoScan?
            </h3>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-300">
              Traditional paper menus get damaged, prices fluctuate, and waiter shortages slow down orders during rush hours. KhaoScan puts your digital photo menu directly on your guests&apos; phones through table QR codes.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2.5 text-sm font-medium text-zinc-200">
                <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>4x faster order turnaround</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm font-medium text-zinc-200">
                <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>Direct UPI to your bank</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm font-medium text-zinc-200">
                <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>Live Kitchen KDS sync</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm font-medium text-zinc-200">
                <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>No expensive hardware needed</span>
              </div>
            </div>

            {/* Testimonial Quote Card */}
            <div className="mt-8 rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-white/[0.02] p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center gap-3 mb-3">
                <Image
                  width={40}
                  height={40}
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                  alt="Chef & Owner"
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-orange-400"
                />
                <div>
                  <p className="text-sm font-bold text-white">Rajesh Verma</p>
                  <p className="text-xs text-orange-300">Owner, Royal Spice Kitchen</p>
                </div>
              </div>
              <p className="text-xs sm:text-sm italic leading-relaxed text-zinc-300">
                &ldquo;KhaoScan completely changed our weekend peak hours. Customers scan, order their food, and pay via UPI directly. Our staff focus on service instead of writing paper KOTs.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
