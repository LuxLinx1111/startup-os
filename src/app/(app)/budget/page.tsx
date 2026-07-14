"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { format, startOfMonth } from "date-fns";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { ExpenseDialog, type ExpenseDTO } from "@/components/budget/expense-dialog";
import { expenseCategoryLabels, formatCurrency } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#0ea5e9", "#a855f7"];

interface Project {
  id: string;
  budgetTotal: string | number | null;
  startDate: string | null;
}

export default function BudgetPage() {
  const { data: expenses, mutate } = useSWR<ExpenseDTO[]>("/api/expenses", fetcher);
  const { data: project } = useSWR<Project>("/api/project", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseDTO | null>(null);

  const stats = useMemo(() => {
    const list = expenses ?? [];
    const spent = list.reduce((sum, e) => sum + Number(e.amount), 0);
    const budgetTotal = project?.budgetTotal ? Number(project.budgetTotal) : null;
    const remaining = budgetTotal !== null ? budgetTotal - spent : null;

    const monthsSinceStart = project?.startDate
      ? Math.max(
          1,
          Math.round((Date.now() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
        )
      : 1;
    const burnRate = spent / monthsSinceStart;
    const runwayMonths = remaining !== null && burnRate > 0 ? remaining / burnRate : null;

    const byCategory = new Map<string, number>();
    for (const e of list) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount));

    const byMonth = new Map<string, number>();
    for (const e of list) {
      const key = format(startOfMonth(new Date(e.date)), "MMM yyyy");
      byMonth.set(key, (byMonth.get(key) ?? 0) + Number(e.amount));
    }

    return {
      spent,
      budgetTotal,
      remaining,
      burnRate,
      runwayMonths,
      byCategory: Array.from(byCategory.entries()).map(([name, value]) => ({
        name: expenseCategoryLabels[name] ?? name,
        value: Number(value.toFixed(2)),
      })),
      byMonth: Array.from(byMonth.entries())
        .map(([month, amount]) => ({ month, amount: Number(amount.toFixed(2)) }))
        .slice(-12),
    };
  }, [expenses, project]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget & Expenses"
        description="Where the money's going, and how much runway you've got left."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add expense
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Total budget"
          value={stats.budgetTotal !== null ? formatCurrency(stats.budgetTotal) : "Not set"}
          icon={Wallet}
        />
        <StatCard label="Spent" value={formatCurrency(stats.spent)} icon={Wallet} />
        <StatCard
          label="Remaining"
          value={stats.remaining !== null ? formatCurrency(stats.remaining) : "—"}
          icon={Wallet}
        />
        <StatCard
          label="Est. runway"
          value={stats.runwayMonths !== null ? `${stats.runwayMonths.toFixed(1)} mo` : "—"}
          hint={`Burn rate: ${formatCurrency(stats.burnRate)}/mo`}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending over time</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by category</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.byCategory} dataKey="value" nameKey="name" outerRadius={80} label>
                  {stats.byCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All expenses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Vendor</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {(expenses ?? []).map((e) => (
                <tr key={e.id} className="hover:bg-accent/30">
                  <td className="px-4 py-2.5">{format(new Date(e.date), "MMM d, yyyy")}</td>
                  <td className="px-4 py-2.5 font-medium">
                    {e.name}
                    {e.isRecurring && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Recurring
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{expenseCategoryLabels[e.category]}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{e.vendor ?? "—"}</td>
                  <td className="px-4 py-2.5 font-medium">{formatCurrency(Number(e.amount))}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(e);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(expenses ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No expenses logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        expense={editing}
        onSaved={() => mutate()}
      />
    </div>
  );
}
