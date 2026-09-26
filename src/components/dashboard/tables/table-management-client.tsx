"use client";

import Link from "next/link";
import {
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  Printer,
  QrCode,
  Trash2,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

export type TableRow = {
  id: string;
  tableNumber: string;
  seats: number;
  status: string;
  url: string;
};

export function TableManagementClient({
  tables,
  canManage,
}: {
  tables: TableRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [tableNumber, setTableNumber] = useState("");
  const [seats, setSeats] = useState("4");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  async function generateQr(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManage) {
      toast.error("Choose a plan to continue managing table QR codes.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber: tableNumber.trim(),
        seats: Number(seats),
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(body?.error ?? "Unable to generate QR.");
      return;
    }

    toast.success(`Table ${tableNumber} QR generated.`);
    setTableNumber("");
    setSeats("4");
    setShowAddForm(false);
    router.refresh();
  }

  function bulkPrintAll() {
    window.print();
  }

  const occupiedCount = tables.filter((t) => t.status === "OCCUPIED" || t.status === "BILLING").length;
  const availableCount = tables.filter((t) => t.status === "AVAILABLE").length;
  const reservedCount = tables.filter((t) => t.status === "RESERVED").length;

  return (
    <div className="space-y-6">
      {/* Top Header matching DineFlow Page 1 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-zinc-950">Table Management</h2>
          <p className="mt-0.5 text-xs font-medium text-zinc-500">
            Monitor table availability and generate QR codes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={bulkPrintAll}
            className="h-9 gap-1.5 rounded-xl border-0 bg-zinc-900 text-white hover:bg-zinc-800 text-xs font-bold shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            Bulk Print QRs
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-9 gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Summary Filter Pills matching DineFlow */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-rose-200/80 bg-white px-3.5 py-1.5 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          <span className="text-xs font-bold text-zinc-900">{String(occupiedCount).padStart(2, "0")} Occupied</span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white px-3.5 py-1.5 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-zinc-900">{String(availableCount).padStart(2, "0")} Available</span>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-amber-200/80 bg-white px-3.5 py-1.5 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-xs font-bold text-zinc-900">{String(reservedCount).padStart(2, "0")} Reserved</span>
        </div>
      </div>

      {/* Inline Add Form */}
      {showAddForm && (
        <Card className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-rose-600" /> Add New Table
          </h3>
          <form onSubmit={generateQr} className="flex flex-wrap items-center gap-3">
            <div className="w-40">
              <Input
                disabled={!canManage}
                required
                placeholder="Table No (e.g. 5)"
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
                className="h-9 bg-white text-xs font-semibold rounded-xl"
              />
            </div>
            <div className="w-32">
              <Input
                disabled={!canManage}
                required
                placeholder="Seats (e.g. 4)"
                type="number"
                min={1}
                max={20}
                value={seats}
                onChange={(event) => setSeats(event.target.value)}
                className="h-9 bg-white text-xs font-semibold rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={!canManage || isSubmitting}
              className="h-9 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Generate Table QR
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="h-9 text-xs font-semibold text-zinc-500 hover:text-zinc-900"
            >
              Cancel
            </Button>
          </form>
        </Card>
      )}

      {/* Tables Grid */}
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {tables.map((table, idx) => (
          <TableCard key={table.id} table={table} index={idx} canManage={canManage} />
        ))}

        {/* New Table Dashed Card matching DineFlow Page 1 */}
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200/90 bg-white/50 p-6 text-center transition-all duration-200 hover:border-rose-400 hover:bg-rose-50/20 active:scale-[0.99]"
        >
          <div className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-400 transition group-hover:text-rose-600">
            <Plus className="h-5 w-5" />
          </div>
          <p className="mt-3 text-xs font-bold text-zinc-700">New Table</p>
          <p className="mt-1 text-[11px] text-zinc-400 font-medium">Click to add & generate QR</p>
        </button>
      </div>

      {tables.length === 0 && !showAddForm && (
        <EmptyState
          icon={QrCode}
          title="No restaurant tables yet"
          description="Add your restaurant tables above to generate customized QR ordering stands for your dining room."
        />
      )}
    </div>
  );
}

function TableCard({
  table,
  index,
  canManage,
}: {
  table: TableRow;
  index: number;
  canManage: boolean;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isOccupied = table.status === "OCCUPIED" || table.status === "BILLING";
  const isReserved = table.status === "RESERVED";

  // Palette for table numbers in mockup (light pink, light green, light yellow, light pink...)
  const numBadgeColors = [
    "bg-rose-50 text-rose-600 border-rose-100",
    "bg-emerald-50 text-emerald-600 border-emerald-100",
    "bg-amber-50 text-amber-600 border-amber-100",
    "bg-rose-50 text-rose-600 border-rose-100",
  ];
  const badgeStyle = numBadgeColors[index % numBadgeColors.length];

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(table.url);
      toast.success(`Table ${table.tableNumber} menu link copied.`);
    } catch {
      toast.error("Failed to copy URL.");
    }
  }

  function downloadPng() {
    const canvas = containerRef.current?.querySelector("canvas");

    if (!canvas) {
      toast.error("Unable to export QR image.");
      return;
    }

    const link = document.createElement("a");
    link.download = `table-${table.tableNumber}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success(`Table ${table.tableNumber} QR downloaded.`);
  }

  function printQr() {
    window.print();
  }

  async function deleteTable() {
    if (!canManage) {
      toast.error("Choose a plan to continue managing tables.");
      return;
    }

    if (isOccupied) {
      toast.error("Cannot delete an occupied or billing table. Please settle all orders first.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete Table ${table.tableNumber}? This will remove its QR code.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/tables", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId: table.id }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        toast.error(data?.error ?? "Failed to delete table.");
        return;
      }

      toast.success(`Table ${table.tableNumber} deleted successfully.`);
      router.refresh();
    } catch {
      toast.error("Network error while deleting table.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="relative rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* Table Number Box centered on top matching Page 1 */}
      <div className="flex items-center justify-between">
        <div className={`grid h-12 w-12 place-items-center rounded-2xl border text-base font-black shadow-xs ${badgeStyle}`}>
          {table.tableNumber.padStart(2, "0")}
        </div>

        {canManage && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isDeleting || isOccupied}
            onClick={deleteTable}
            className="h-7 w-7 rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition"
            title={isOccupied ? "Cannot delete occupied table" : `Delete Table ${table.tableNumber}`}
            aria-label={`Delete Table ${table.tableNumber}`}
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </div>

      <div className="mt-3.5">
        <h3 className="text-sm font-black text-zinc-950">Table {table.tableNumber}</h3>
        <p className="mt-0.5 text-xs text-zinc-500 font-medium">
          {table.seats} Seats • {isOccupied ? "Occupied" : isReserved ? "Reserved" : "Empty"}
        </p>
      </div>

      {/* Status Pill matching Page 1 */}
      <div className="mt-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
            isOccupied
              ? "bg-rose-50 text-rose-600 border border-rose-200"
              : isReserved
                ? "bg-amber-50 text-amber-600 border border-amber-200"
                : "bg-emerald-50 text-emerald-600 border border-emerald-200"
          }`}
        >
          {isOccupied ? "OCCUPIED" : isReserved ? "RESERVED" : "AVAILABLE"}
        </span>
      </div>

      {/* QR Code Container */}
      <div
        ref={containerRef}
        className="mt-4 grid place-items-center rounded-xl border border-zinc-100 bg-zinc-50/70 p-3"
      >
        <QRCodeCanvas value={table.url} size={120} includeMargin aria-label={`Table ${table.tableNumber} QR`} />
      </div>

      {/* Actions */}
      <div className="mt-4 grid grid-cols-2 gap-1.5 text-xs">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={copyUrl}
          className="h-7 gap-1 rounded-lg text-[11px] font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200"
        >
          <Copy className="h-3 w-3" /> Copy
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={downloadPng}
          className="h-7 gap-1 rounded-lg text-[11px] font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200"
        >
          <Download className="h-3 w-3" /> Save
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={printQr}
          className="h-7 gap-1 rounded-lg text-[11px] font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200"
        >
          <Printer className="h-3 w-3" /> Print
        </Button>
        <Link href={table.url} target="_blank">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 w-full gap-1 rounded-lg text-[11px] font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200"
          >
            <ExternalLink className="h-3 w-3" /> View
          </Button>
        </Link>
      </div>
    </Card>
  );
}
