"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Hash, Banknote, Smartphone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePakVault, type Deposit } from "@/components/pakvault-provider";
import { cn } from "@/lib/utils";

const METHODS: {
  id: Deposit["method"];
  account: string;
  hint: string;
}[] = [
  { id: "EasyPaisa", account: "03280186930", hint: "PakVault Wallet" },
  { id: "JazzCash", account: "03280186930", hint: "PakVault Merchant" },
];

export function DepositScreen({ onBack }: { onBack: () => void }) {
  const { submitDeposit } = usePakVault();
  const [method, setMethod] = useState<Deposit["method"]>("EasyPaisa");
  const [trxId, setTrxId] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selected = METHODS.find((m) => m.id === method)!;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numeric = Number(amount);
    if (!trxId.trim()) {
      toast.error("Please enter the Transaction ID.");
      return;
    }
    if (!numeric || numeric <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    setSubmitting(true);
    submitDeposit(method, trxId, numeric);
    setSubmitting(false);
    setTrxId("");
    setAmount("");
    toast.success("Payment request submitted! We will verify it shortly.");
    onBack();
  }

  return (
    <div className="flex flex-col px-5 pb-6 pt-8">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex size-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Go back"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Deposit</h1>
          <p className="text-xs text-muted-foreground">
            Top up your Digital Coins
          </p>
        </div>
      </header>

      {/* Method selector */}
      <div className="mt-6">
        <Label className="mb-2 block">Payment method</Label>
        <div className="grid grid-cols-2 gap-3">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors",
                method === m.id
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:bg-secondary",
              )}
            >
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  method === m.id
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                <Smartphone className="size-4" />
              </span>
              <span className="text-sm font-semibold">{m.id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Account to send to */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <p className="leading-relaxed">
            Send your payment to the {selected.id} account below, then enter the
            Transaction ID you receive.
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-secondary px-3 py-2.5">
          <div>
            <p className="font-mono text-sm font-semibold tracking-wide">
              {selected.account}
            </p>
            <p className="text-xs text-muted-foreground">{selected.hint}</p>
          </div>
          <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
            {selected.id}
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="trxId">Transaction ID (Trx ID)</Label>
          <div className="relative">
            <Hash className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="trxId"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              placeholder="e.g. 9X2K7QP4"
              className="pl-9 font-mono"
              inputMode="text"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="amount">Amount (PKR)</Label>
          <div className="relative">
            <Banknote className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500"
              className="pl-9"
              inputMode="numeric"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="mt-2 h-11 text-base"
          disabled={submitting}
        >
          Submit Payment Request
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Requests are reviewed manually. Coins are added once your payment is
          verified.
        </p>
      </form>
    </div>
  );
}
