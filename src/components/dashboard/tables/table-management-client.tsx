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
  Sparkles,
  Table2,
  Users,
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
    router.refresh();
  }

  const occupiedCount = tables.filter((t) => t.status === "OCCUPIED" || t.status === "BILLING").length;
  const availableCount = tables.filter((t) => t.status === "AVAILABLE").length;

  return (
    <div className="space-y-6">
      {/* Floor Overview & Add Table Card */}
      <Card className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Table2 className="h-5 w-5 text-emerald-700" />
              <h2 className="text-xl font-bold text-zinc-950">Table Floor Management</h2>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Generate static dine-in QR codes. Total {tables.length} tables ({occupiedCount} occupied, {availableCount} available).
            </p>
          </div>

          <form onSubmit={generateQr} className="flex flex-wrap items-center gap-3">
            <div className="w-36">
              <Input
                disabled={!canManage}
                required
                placeholder="Table No (e.g. 5)"
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
                className="h-10 text-xs font-semibold"
              />
            </div>
            <div className="w-28">
              <Input
                disabled={!canManage}
                required
                placeholder="Seats"
                type="number"
                min={1}
                max={20}
                value={seats}
                onChange={(event) => setSeats(event.target.value)}
                className="h-10 text-xs font-semibold"
              />
            </div>
            <Button
              type="submit"
              disabled={!canManage || isSubmitting}
              className="h-10 gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Generate Table QR
            </Button>
          </form>
        </div>
      </Card>

      {tables.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Table Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tables.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>

          {/* Right Guidance Sidebar */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-zinc-950">Table QR Best Practices</h3>
              </div>
              <ul className="mt-3 space-y-2.5 text-xs text-zinc-600 leading-5">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span><strong>Permanent Links:</strong> Table QR URLs never change. You can print them on acrylic table stands once.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span><strong>Instant Table Lock:</strong> When guests scan the QR code, the order automatically tags to that specific table.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span><strong>Direct Bill Reset:</strong> Settling a table bill frees up the table for the next dining party automatically.</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={QrCode}
          title="No restaurant tables yet"
          description="Add your restaurant tables above to generate customized QR ordering stands for your dining room."
        />
      )}
    </div>
  );
}

function TableCard({ table }: { table: TableRow }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isOccupied = table.status === "OCCUPIED" || table.status === "BILLING";

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

  return (
    <Card
      className={`p-5 transition-all duration-200 hover:-translate-y-0.5 ${
        isOccupied ? "border-emerald-300 bg-emerald-50/20" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-black text-zinc-950">
              Table {table.tableNumber}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 font-medium">
            <Users className="h-3 w-3" />
            {table.seats} Seats (Capacity)
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            isOccupied
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
              : "bg-zinc-100 text-zinc-600 border border-zinc-200"
          }`}
        >
          {isOccupied ? "Occupied" : "Available"}
        </span>
      </div>

      {/* QR Code Container */}
      <div
        ref={containerRef}
        className="mt-4 grid place-items-center rounded-2xl border border-zinc-200/80 bg-zinc-50 p-4"
      >
        <QRCodeCanvas value={table.url} size={160} includeMargin aria-label={`Table ${table.tableNumber} QR`} />
      </div>

      {/* Action Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={copyUrl}
          className="h-8 gap-1 text-xs font-semibold text-zinc-700"
        >
          <Copy className="h-3.5 w-3.5" /> Copy Link
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={downloadPng}
          className="h-8 gap-1 text-xs font-semibold text-zinc-700"
        >
          <Download className="h-3.5 w-3.5" /> Save PNG
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={printQr}
          className="h-8 gap-1 text-xs font-semibold text-zinc-700"
        >
          <Printer className="h-3.5 w-3.5" /> Print
        </Button>
        <Link href={table.url} target="_blank">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 w-full gap-1 text-xs font-semibold text-zinc-700"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Preview
          </Button>
        </Link>
      </div>
    </Card>
  );
}
