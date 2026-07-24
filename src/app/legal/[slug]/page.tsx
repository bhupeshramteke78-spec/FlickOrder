import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { FlickOrderLogo } from "@/components/brand/flickorder-logo";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

type LegalPage = {
  title: string;
  description: string;
  updatedAt: string;
  sections: Array<{
    heading: string;
    body: string[];
  }>;
};

const legalPages: Record<string, LegalPage> = {
  terms: {
    title: "Terms and Conditions",
    description: "Rules for using FlickOrder as a restaurant operator, staff member, or dine-in guest.",
    updatedAt: "24 July 2026",
    sections: [
      {
        heading: "Platform Scope",
        body: [
          "FlickOrder is an in-restaurant experience and operations platform. It is not a food delivery marketplace and does not take custody of customer food payments.",
          "Restaurants use FlickOrder to manage QR menus, tables, orders, staff workflows, payment verification, analytics, and account settings.",
        ],
      },
      {
        heading: "Restaurant Responsibilities",
        body: [
          "Restaurant owners are responsible for menu accuracy, item availability, prices, taxes, opening hours, staff access, service quality, and customer communication.",
          "Restaurants must provide accurate registration, UPI, contact, address, and verification details. FlickOrder may suspend or reject accounts that appear fraudulent or incomplete.",
        ],
      },
      {
        heading: "Customer Orders",
        body: [
          "Dine-in customers can place orders through table QR links without creating an account. Prices and availability are validated server-side before an order is created.",
          "Restaurants are responsible for accepting, preparing, serving, cancelling, or resolving customer orders inside their premises.",
        ],
      },
      {
        heading: "Subscriptions",
        body: [
          "Restaurant subscription plans are billed for access to FlickOrder software features. Paid plans are activated only after payment verification.",
          "Plan features may be updated over time, but FlickOrder will avoid materially reducing active paid-plan access without notice.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description: "How FlickOrder handles restaurant, staff, customer, order, payment, and device notification data.",
    updatedAt: "24 July 2026",
    sections: [
      {
        heading: "Data We Collect",
        body: [
          "We collect restaurant registration details, profile settings, staff roles, menu data, table data, orders, order items, payment status, service requests, and audit records needed to operate FlickOrder.",
          "For QR orders, customers may enter their name and order preferences. Customers are not required to create an account for table ordering.",
        ],
      },
      {
        heading: "How Data Is Used",
        body: [
          "Data is used to run restaurant operations, display menus, process orders, verify payments, generate analytics, support staff workflows, and maintain security.",
          "Restaurant payment details are used to generate direct payment flows. FlickOrder does not store customer card details.",
        ],
      },
      {
        heading: "Security",
        body: [
          "Authentication is handled through Supabase Auth. Passwords are never stored manually in FlickOrder tables.",
          "Sensitive operations are validated through server routes, role checks, plan checks, and row-level security policies.",
        ],
      },
      {
        heading: "Device Notifications",
        body: [
          "Restaurant admins can optionally enable browser or device push notifications for new orders. Notification permission can be revoked from browser or operating system settings.",
          "Push subscription records are used only to deliver operational notifications for the selected restaurant.",
        ],
      },
    ],
  },
  refund: {
    title: "Refund Policy",
    description: "Refund expectations for FlickOrder subscription payments and restaurant customer payments.",
    updatedAt: "24 July 2026",
    sections: [
      {
        heading: "Restaurant Subscription Payments",
        body: [
          "FlickOrder subscriptions pay for software access. Refund requests are reviewed case by case when duplicate charges, failed activation, or billing errors occur.",
          "Trial access is provided so restaurants can test the platform before continuing with a paid plan.",
        ],
      },
      {
        heading: "Customer Food Payments",
        body: [
          "Customer food payments go directly to the restaurant through UPI, cash, or card-machine flows. FlickOrder does not hold these funds.",
          "Refunds for food orders, service issues, cancelled orders, or incorrect charges must be handled by the restaurant directly.",
        ],
      },
      {
        heading: "How To Request Support",
        body: [
          "For FlickOrder subscription billing support, contact hello@flickorder.in with the restaurant name, payment reference, and issue details.",
          "For dine-in order refunds, customers should contact the restaurant staff or owner at the restaurant location.",
        ],
      },
    ],
  },
  disclaimer: {
    title: "Disclaimer",
    description: "Important limits around restaurant operations, payments, availability, and third-party services.",
    updatedAt: "24 July 2026",
    sections: [
      {
        heading: "Restaurant-Controlled Operations",
        body: [
          "Menus, prices, availability, service quality, preparation time, table status, payment confirmation, and order fulfilment are controlled by the restaurant.",
          "FlickOrder provides software tools and cannot guarantee food quality, preparation speed, restaurant seating, or staff response times.",
        ],
      },
      {
        heading: "Payments",
        body: [
          "Customer payment flows may depend on UPI apps, banking networks, device support, and restaurant payment settings.",
          "Restaurant subscription payments may depend on Razorpay, bank processing, and successful server-side verification.",
        ],
      },
      {
        heading: "Availability",
        body: [
          "Realtime features depend on browser connectivity, Supabase availability, and restaurant device access. Temporary delays may occur during network issues.",
          "FlickOrder may update features, plans, or operational policies to improve security, reliability, and business fit.",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(legalPages).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = legalPages[slug];

  if (!page) {
    return {};
  }

  return {
    title: page.title,
    description: page.description,
  };
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = legalPages[slug];

  if (!page) {
    notFound();
  }

  return (
    <main className="customer-surface min-h-screen text-white">
      <section className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3 font-semibold text-white">
            <FlickOrderLogo className="h-10 w-10 rounded-xl" priority />
            FlickOrder
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
        </div>

        <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/30 backdrop-blur">
          <header className="border-b border-white/10 p-6 md:p-8">
            <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-200">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-200">FlickOrder legal</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">{page.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300">{page.description}</p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Last updated: {page.updatedAt}</p>
          </header>

          <div className="grid gap-6 p-6 md:p-8">
            {page.sections.map((section) => (
              <section key={section.heading} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h2 className="text-xl font-semibold text-white">{section.heading}</h2>
                <div className="mt-3 grid gap-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-zinc-300">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </section>
      <MarketingFooter />
    </main>
  );
}
