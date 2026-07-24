"use client";

import {
  ArrowUpRight,
  Check,
  Clock3,
  History,
  Landmark,
  Loader2,
  Search,
  ShieldCheck,
  Store,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FlickOrderLogo } from "@/components/brand/flickorder-logo";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export type SuperAdminSubscriptionRequest = {
  id: string;
  restaurantName: string;
  ownerName: string;
  plan: "basic" | "growth" | "pro";
  amount: number;
  status: string;
  transactionNote: string;
  createdAt: string;
};

export type SuperAdminRestaurant = {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  address: string;
  fssaiNumber: string | null;
  googleMapsUrl: string | null;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | "MORE_INFO_REQUIRED";
  verificationNote: string | null;
  documents: Array<{ id: string; type: string; url: string }>;
  plan: "trial" | "basic" | "growth" | "pro";
  status: "TRIALING" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  createdAt: string;
};

export type SuperAdminCustomer = {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
};

export type SuperAdminOrder = {
  id: string;
  orderNumber: string;
  restaurantName: string;
  customerName: string;
  tableNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  itemSummary: string;
};

export type SuperAdminAuditLog = {
  id: string;
  actorName: string;
  restaurantName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
};

export type SuperAdminDashboardData = {
  adminName: string;
  requests: SuperAdminSubscriptionRequest[];
  restaurants: SuperAdminRestaurant[];
  customers: SuperAdminCustomer[];
  orders: SuperAdminOrder[];
  auditLogs: SuperAdminAuditLog[];
};

const planOptions = ["trial", "basic", "growth", "pro"] as const;
const statusOptions = ["TRIALING", "ACTIVE", "EXPIRED", "CANCELLED"] as const;
const sections = [
  { id: "verify", label: "Verify" },
  { id: "verification-status", label: "Trust" },
  { id: "restaurants", label: "Restaurants" },
  { id: "records", label: "Records" },
  { id: "audit", label: "Audit" },
] as const;

type RestaurantDraft = {
  plan: SuperAdminRestaurant["plan"];
  status: SuperAdminRestaurant["status"];
};

export function SuperAdminControlPanel({ data }: { data: SuperAdminDashboardData }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [restaurantDrafts, setRestaurantDrafts] = useState<Record<string, RestaurantDraft>>(() =>
    Object.fromEntries(
      data.restaurants.map((restaurant) => [
        restaurant.id,
        { plan: restaurant.plan, status: restaurant.status },
      ]),
    ),
  );
  const normalizedSearch = search.trim().toLowerCase();
  const activeRestaurants = data.restaurants.filter((restaurant) => restaurant.status === "ACTIVE" || restaurant.status === "TRIALING").length;
  const lockedRestaurants = data.restaurants.length - activeRestaurants;
  const paidRevenue = data.orders
    .filter((order) => order.paymentStatus === "PAID")
    .reduce((total, order) => total + order.total, 0);
  const todayOrders = data.orders.filter((order) => isToday(order.createdAt)).length;
  const verificationQueue = data.restaurants.filter((restaurant) => restaurant.verificationStatus === "PENDING" || restaurant.verificationStatus === "MORE_INFO_REQUIRED");

  const filteredOrders = useMemo(() => {
    if (!normalizedSearch) {
      return data.orders;
    }

    return data.orders.filter((order) =>
      [
        order.orderNumber,
        order.restaurantName,
        order.customerName,
        order.tableNumber,
        order.status,
        order.paymentStatus,
        order.itemSummary,
        String(order.total),
      ].some((value) => value.toLowerCase().includes(normalizedSearch)),
    );
  }, [data.orders, normalizedSearch]);

  const filteredCustomers = useMemo(() => {
    if (!normalizedSearch) {
      return data.customers;
    }

    return data.customers.filter((customer) =>
      [customer.name, customer.phone ?? "", customer.id].some((value) => value.toLowerCase().includes(normalizedSearch)),
    );
  }, [data.customers, normalizedSearch]);

  async function reviewRequest(requestId: string, action: "APPROVE" | "REJECT") {
    setLoadingId(requestId);
    const response = await fetch(`/api/subscription-upgrades/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setLoadingId(null);

    if (!response.ok) {
      toast.error(body?.error ?? "Unable to update subscription payment.");
      return;
    }

    toast.success(action === "APPROVE" ? "Subscription payment approved." : "Subscription payment rejected.");
    router.refresh();
  }

  async function updateSubscription(restaurant: SuperAdminRestaurant) {
    const draft = restaurantDrafts[restaurant.id];

    if (!draft) {
      return;
    }

    setLoadingId(restaurant.id);
    const response = await fetch(`/api/admin/restaurants/${restaurant.id}/subscription`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setLoadingId(null);

    if (!response.ok) {
      toast.error(body?.error ?? "Unable to update plan status.");
      return;
    }

    toast.success(`${restaurant.name} subscription updated.`);
    router.refresh();
  }

  async function updateVerification(restaurant: SuperAdminRestaurant, status: "APPROVED" | "REJECTED" | "MORE_INFO_REQUIRED") {
    const note =
      status === "APPROVED"
        ? "Verified by FlickOrder super admin."
        : status === "REJECTED"
          ? "Restaurant proof could not be verified."
          : "More restaurant proof is required before approval.";

    setLoadingId(`${restaurant.id}-${status}`);
    const response = await fetch(`/api/admin/restaurants/${restaurant.id}/verification`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setLoadingId(null);

    if (!response.ok) {
      toast.error(body?.error ?? "Unable to update restaurant verification.");
      return;
    }

    toast.success(`${restaurant.name} verification updated.`);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#eef2f4] text-zinc-950">
      <header className="relative overflow-hidden bg-[#071117] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(255,102,0,0.22),transparent_30%),radial-gradient(circle_at_76%_10%,rgba(16,185,129,0.22),transparent_34%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-7 px-5 py-7 lg:grid-cols-[1fr_340px]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <FlickOrderLogo className="h-11 w-11 rounded-xl" priority />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">FlickOrder Command</p>
                <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Platform operations desk</h1>
              </div>
            </div>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-zinc-300">
              Monitor subscription risk, verify payments, inspect restaurants, and trace important control actions from one protected surface.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-4">
              <CommandMetric label="Active accounts" value={String(activeRestaurants)} tone="emerald" />
              <CommandMetric label="Needs attention" value={String(data.requests.length + lockedRestaurants + verificationQueue.length)} tone="orange" />
              <CommandMetric label="Today orders" value={String(todayOrders)} tone="zinc" />
              <CommandMetric label="Paid revenue" value={formatCurrency(paidRevenue)} tone="emerald" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-300">Signed in as</p>
                <p className="mt-1 text-xl font-semibold">{data.adminName}</p>
              </div>
              <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                Password unlocked
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-orange-300/30 hover:bg-orange-400/10 hover:text-white"
                >
                  {section.label}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-5 py-6">
        <section id="verify" className="grid gap-4 lg:grid-cols-[0.74fr_1fr]">
          <Panel className="bg-[#0d1817] text-white">
            <PanelHeading
              icon={ShieldCheck}
              eyebrow="Verification queue"
              title="Restaurants and payments that need review"
              description="Approve restaurants only after business proof looks trustworthy. Every decision is written to the audit log."
              dark
            />
            <div className="mt-6 grid grid-cols-2 gap-3">
              <MiniStat label="Restaurants" value={String(verificationQueue.length)} />
              <MiniStat label="Payments" value={String(data.requests.length)} />
            </div>
          </Panel>

          <Panel>
            {verificationQueue.length > 0 ? (
              <div className="mb-6 grid gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Restaurant approvals</p>
                {verificationQueue.map((restaurant) => (
                  <article key={restaurant.id} className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                    <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{restaurant.name}</h3>
                          <StatusPill value={restaurant.verificationStatus} />
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
                          <span>Owner: <b className="text-zinc-950">{restaurant.ownerName}</b></span>
                          <span>Phone: <b className="text-zinc-950">{restaurant.phone}</b></span>
                          <span>FSSAI: <b className="text-zinc-950">{restaurant.fssaiNumber ?? "Not provided"}</b></span>
                          <span>Location: <b className="text-zinc-950">{restaurant.city}, {restaurant.state}</b></span>
                        </div>
                        <p className="mt-3 text-sm text-zinc-600">{restaurant.address}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {restaurant.googleMapsUrl ? <ProofLink href={restaurant.googleMapsUrl} label="Google Maps" /> : null}
                          {restaurant.documents.map((document) => (
                            <ProofLink key={document.id} href={document.url} label={formatAction(document.type)} />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                        <Button type="button" disabled={loadingId !== null} onClick={() => updateVerification(restaurant, "APPROVED")}>
                          {loadingId === `${restaurant.id}-APPROVED` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Approve
                        </Button>
                        <Button type="button" variant="secondary" disabled={loadingId !== null} onClick={() => updateVerification(restaurant, "MORE_INFO_REQUIRED")}>
                          More info
                        </Button>
                        <Button type="button" variant="danger" disabled={loadingId !== null} onClick={() => updateVerification(restaurant, "REJECTED")}>
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
            {data.requests.length > 0 ? (
              <div className="grid gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Subscription payments</p>
                {data.requests.map((request) => (
                  <article key={request.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{request.restaurantName}</h3>
                          <StatusPill value={request.status} />
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-3">
                          <span>Owner: <b className="text-zinc-950">{request.ownerName}</b></span>
                          <span>Plan: <b className="capitalize text-zinc-950">{request.plan}</b></span>
                          <span>Amount: <b className="text-emerald-700">{formatCurrency(request.amount)}</b></span>
                        </div>
                        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-zinc-500">Transaction note: {request.transactionNote}</p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                        <Button type="button" disabled={loadingId !== null} onClick={() => reviewRequest(request.id, "APPROVE")}>
                          {loadingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Approve
                        </Button>
                        <Button type="button" variant="danger" disabled={loadingId !== null} onClick={() => reviewRequest(request.id, "REJECT")}>
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : verificationQueue.length === 0 ? (
              <EmptyState title="The queue is clear" description="New restaurant and subscription verification requests will appear here." />
            ) : null}
          </Panel>
        </section>

        <section id="verification-status">
          <Panel>
            <PanelHeading
              icon={ShieldCheck}
              eyebrow="Trust status"
              title="Restaurant verification overview"
              description="Only approved restaurants are visible to customers and allowed to run live QR operations."
            />
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {(["PENDING", "MORE_INFO_REQUIRED", "APPROVED", "REJECTED"] as const).map((status) => (
                <MiniStatus key={status} label={formatAction(status)} value={String(data.restaurants.filter((restaurant) => restaurant.verificationStatus === status).length)} />
              ))}
            </div>
          </Panel>
        </section>

        <section id="restaurants" className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Panel>
            <PanelHeading
              icon={Store}
              eyebrow="Restaurant control"
              title="Accounts and subscription state"
              description="Change plan status only when support or payment review requires it."
            />
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="py-3 pr-4">Restaurant</th>
                    <th className="py-3 pr-4">Owner</th>
                    <th className="py-3 pr-4">Location</th>
                    <th className="py-3 pr-4">Verification</th>
                    <th className="py-3 pr-4">Plan</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.restaurants.map((restaurant) => {
                    const draft = restaurantDrafts[restaurant.id] ?? { plan: restaurant.plan, status: restaurant.status };

                    return (
                      <tr key={restaurant.id} className="align-middle">
                        <td className="py-4 pr-4">
                          <p className="font-semibold">{restaurant.name}</p>
                          <p className="mt-1 text-xs text-zinc-500">Created {formatDate(restaurant.createdAt)}</p>
                        </td>
                        <td className="py-4 pr-4 text-zinc-600">{restaurant.ownerName}</td>
                        <td className="py-4 pr-4 text-zinc-600">{restaurant.city}, {restaurant.state}</td>
                        <td className="py-4 pr-4"><StatusPill value={restaurant.verificationStatus} /></td>
                        <td className="py-4 pr-4">
                          <Select
                            value={draft.plan}
                            options={planOptions}
                            onChange={(value) =>
                              setRestaurantDrafts((current) => ({
                                ...current,
                                [restaurant.id]: { ...draft, plan: value as SuperAdminRestaurant["plan"] },
                              }))
                            }
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <Select
                            value={draft.status}
                            options={statusOptions}
                            onChange={(value) =>
                              setRestaurantDrafts((current) => ({
                                ...current,
                                [restaurant.id]: { ...draft, status: value as SuperAdminRestaurant["status"] },
                              }))
                            }
                          />
                        </td>
                        <td className="py-4">
                          <Button type="button" size="sm" disabled={loadingId !== null} onClick={() => updateSubscription(restaurant)}>
                            {loadingId === restaurant.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                            Save
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel>
            <PanelHeading
              icon={Landmark}
              eyebrow="Portfolio"
              title="Plan mix"
              description="Live distribution from registered restaurant subscriptions."
            />
            <div className="mt-5 grid gap-3">
              {planOptions.map((plan) => {
                const count = data.restaurants.filter((restaurant) => restaurant.plan === plan).length;
                const width = data.restaurants.length > 0 ? Math.max(8, (count / data.restaurants.length) * 100) : 0;

                return (
                  <div key={plan}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold capitalize">{plan}</span>
                      <span className="text-zinc-500">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </section>

        <section id="records">
          <Panel>
            <div className="grid gap-5 lg:grid-cols-[0.65fr_1fr] lg:items-end">
              <PanelHeading
                icon={Search}
                eyebrow="Search"
                title="Customers and orders"
                description="Search by customer, order number, restaurant, table, item, status, or amount."
              />
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <Search className="h-4 w-4 text-zinc-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search platform records"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <RecordColumn title="Customers" count={filteredCustomers.length} icon={UserRound}>
                {filteredCustomers.length > 0 ? filteredCustomers.slice(0, 10).map((customer) => (
                  <RecordLine key={customer.id} title={customer.name} detail={customer.phone ?? "No phone"} meta={formatDate(customer.createdAt)} />
                )) : <EmptyState title="No customers found" description="Try a different search." />}
              </RecordColumn>

              <RecordColumn title="Orders" count={filteredOrders.length} icon={Clock3}>
                {filteredOrders.length > 0 ? filteredOrders.slice(0, 10).map((order) => (
                  <RecordLine
                    key={order.id}
                    title={`#${order.orderNumber} | ${order.customerName}`}
                    detail={`${order.restaurantName} | Table ${order.tableNumber} | ${order.itemSummary}`}
                    meta={`${formatCurrency(order.total)} | ${order.paymentStatus}`}
                  />
                )) : <EmptyState title="No orders found" description="Try another name, order ID, item, or amount." />}
              </RecordColumn>
            </div>
          </Panel>
        </section>

        <section id="audit">
          <Panel>
            <PanelHeading
              icon={History}
              eyebrow="Audit trail"
              title="Important platform actions"
              description="Approvals, rejections, and manual plan changes show here with actor, restaurant, and timestamp."
            />
            <div className="mt-5 grid gap-3">
              {data.auditLogs.length > 0 ? data.auditLogs.map((log) => (
                <div key={log.id} className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="font-semibold">{formatAction(log.action)}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {log.actorName} | {log.restaurantName ?? "Platform"} | {log.entity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-500">{formatDate(log.createdAt)}</p>
                </div>
              )) : <EmptyState title="No audit entries yet" description="Important super-admin actions will appear here." />}
            </div>
          </Panel>
        </section>
      </main>
    </div>
  );
}

function CommandMetric({ label, value, tone }: { label: string; value: string; tone: "emerald" | "orange" | "zinc" }) {
  const toneClass = {
    emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
    orange: "border-orange-300/25 bg-orange-400/10 text-orange-100",
    zinc: "border-white/10 bg-white/[0.06] text-zinc-100",
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm shadow-zinc-200/70 ${className}`}>
      {children}
    </div>
  );
}

function PanelHeading({
  icon: Icon,
  eyebrow,
  title,
  description,
  dark = false,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${dark ? "bg-white/10 text-emerald-100" : "bg-emerald-50 text-emerald-700"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${dark ? "text-emerald-200" : "text-emerald-700"}`}>{eyebrow}</p>
        <h2 className={`mt-2 text-2xl font-semibold ${dark ? "text-white" : "text-zinc-950"}`}>{title}</h2>
        <p className={`mt-2 max-w-3xl text-sm leading-6 ${dark ? "text-zinc-300" : "text-zinc-500"}`}>{description}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniStatus({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function ProofLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-emerald-200 hover:text-emerald-700"
    >
      {label}
      <ArrowUpRight className="h-3 w-3" />
    </a>
  );
}

function StatusPill({ value }: { value: string }) {
  const isGood = value === "ACTIVE" || value === "APPROVED" || value === "PAID";
  const isWarning = value === "TRIALING" || value === "VERIFICATION_PENDING" || value === "PENDING_PAYMENT" || value === "PENDING" || value === "MORE_INFO_REQUIRED";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
        isGood
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : isWarning
            ? "border-orange-200 bg-orange-50 text-orange-800"
            : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {formatAction(value)}
    </span>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-semibold capitalize outline-none transition focus:border-emerald-400"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {formatAction(option)}
        </option>
      ))}
    </select>
  );
}

function RecordColumn({
  title,
  count,
  icon: Icon,
  children,
}: {
  title: string;
  count: number;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-emerald-700" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-500">{count}</span>
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function RecordLine({ title, detail, meta }: { title: string; detail: string; meta: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm shadow-zinc-200/70">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{detail}</p>
      <p className="mt-3 text-xs font-semibold text-emerald-700">{meta}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>
    </div>
  );
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();

  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAction(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
