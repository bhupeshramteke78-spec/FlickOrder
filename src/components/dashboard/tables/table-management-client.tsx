"use client";

import Link from "next/link";
import { Copy, Download, ExternalLink, Loader2, Printer, QrCode } from "lucide-react";
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

export function TableManagementClient({ tables, canManage }: { tables: TableRow[]; canManage: boolean }) {
  const router = useRouter();
  const [tableNumber, setTableNumber] = useState("");
  const [seats, setSeats] = useState("2");
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
        tableNumber,
        seats: Number(seats),
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(body?.error ?? "Unable to generate QR.");
      return;
    }

    toast.success("Table QR generated.");
    setTableNumber("");
    setSeats("2");
    router.refresh();
  }

  return (
    <>
      <Card className="mb-5">
        <form onSubmit={generateQr} className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <Input disabled={!canManage} required placeholder="Table number" value={tableNumber} onChange={(event) => setTableNumber(event.target.value)} />
          <Input disabled={!canManage} required placeholder="Seats" type="number" min={1} value={seats} onChange={(event) => setSeats(event.target.value)} />
          <Button type="submit" disabled={!canManage || isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            Generate QR
          </Button>
        </form>
      </Card>

      {tables.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tables.map((table) => (
              <TableCard key={table.id} table={table} />
            ))}
          </div>
          <Card>
            <h2 className="text-lg font-semibold text-zinc-950">QR instructions</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Every table has a stable QR URL. Guests scan it and land directly on the correct menu and table page.
            </p>
          </Card>
        </div>
      ) : (
        <EmptyState icon={QrCode} title="No tables loaded" description="Create tables to generate stable QR codes for guest ordering." />
      )}
    </>
  );
}

function TableCard({ table }: { table: TableRow }) {
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  async function copyUrl() {
    await navigator.clipboard.writeText(table.url);
    toast.success("Customer page URL copied.");
  }

  function downloadPng() {
    const canvas = qrRef.current;

    if (!canvas) {
      return;
    }

    const link = document.createElement("a");
    link.download = `table-${table.tableNumber}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function printQr() {
    window.print();
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-zinc-950">Table {table.tableNumber}</h3>
          <p className="mt-1 text-sm text-zinc-500">{table.seats} seats</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
          table.status === "OCCUPIED" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
        }`}>
          {table.status.toLowerCase()}
        </span>
      </div>
      <div className="mt-4 grid place-items-center rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <QRCodeCanvas ref={qrRef} value={table.url} size={180} includeMargin />
      </div>
      <p className="mt-3 break-all text-xs text-zinc-500">{table.url}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={copyUrl}>
          <Copy className="h-4 w-4" /> Copy
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={downloadPng}>
          <Download className="h-4 w-4" /> PNG
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={printQr}>
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Link href={table.url}>
          <Button type="button" variant="secondary" size="sm" className="w-full">
            <ExternalLink className="h-4 w-4" /> Open
          </Button>
        </Link>
      </div>
    </Card>
  );
}
