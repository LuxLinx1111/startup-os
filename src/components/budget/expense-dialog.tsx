"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { expenseCategoryLabels } from "@/lib/utils";

export interface ExpenseDTO {
  id: string;
  category: string;
  name: string;
  amount: string | number;
  isRecurring: boolean;
  recurrenceInterval: string | null;
  date: string;
  vendor: string | null;
  notes: string | null;
}

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  expense?: ExpenseDTO | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [vendor, setVendor] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (expense) {
      setName(expense.name);
      setCategory(expense.category);
      setAmount(String(expense.amount));
      setDate(expense.date.slice(0, 10));
      setVendor(expense.vendor ?? "");
      setIsRecurring(expense.isRecurring);
      setNotes(expense.notes ?? "");
    } else if (open) {
      setName("");
      setCategory("OTHER");
      setAmount("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setVendor("");
      setIsRecurring(false);
      setNotes("");
    }
  }, [expense, open]);

  async function handleSave() {
    if (!name.trim() || !amount) return;
    setSaving(true);
    const payload = {
      name,
      category,
      amount: Number(amount),
      date,
      vendor: vendor || null,
      isRecurring,
      notes: notes || null,
    };
    try {
      if (expense) {
        await fetch(`/api/expenses/${expense.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? "Edit expense" : "Add expense"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Figma subscription" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(expenseCategoryLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (USD)</Label>
              <Input type="number" min={0} step={0.01} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Vendor</Label>
              <Input value={vendor} onChange={(e) => setVendor(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={isRecurring} onCheckedChange={(c) => setIsRecurring(c === true)} id="recurring-exp" />
            <Label htmlFor="recurring-exp" className="font-normal">
              Recurring subscription
            </Label>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
