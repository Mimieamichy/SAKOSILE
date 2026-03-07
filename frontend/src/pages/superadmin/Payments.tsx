import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import jsPDF from "jspdf";

type TxnStatus = "success" | "failed" | "refunded" | "pending";

type Transaction = {
  id: string;
  date: string;
  school: string;
  amount: number;
  status: TxnStatus;
  reference: string;
  student: string;
};

type RefundRequest = {
  id: string;
  txnId: string;
  school: string;
  amount: number;
  reason: string;
  status: "open" | "resolved";
  date: string;
};

type Payout = {
  id: string;
  school: string;
  amount: number;
  date: string;
  status: "queued" | "processing" | "paid";
};

const txnsSeed: Transaction[] = [
  { id: "TX-1001", date: "2026-03-01", school: "College of Science", amount: 25000, status: "success", reference: "REF-1A2B3C", student: "2023/PG/SCS/CS/0001" },
  { id: "TX-1002", date: "2026-03-02", school: "College of Engineering", amount: 40000, status: "success", reference: "REF-4D5E6F", student: "2023/PG/SCS/CS/0002" },
  { id: "TX-1003", date: "2026-03-03", school: "College of Medicine", amount: 60000, status: "failed", reference: "REF-7G8H9I", student: "2023/PG/SCS/CS/0003" },
  { id: "TX-1004", date: "2026-03-04", school: "College of Education", amount: 15000, status: "success", reference: "REF-0J1K2L", student: "2023/PG/SCS/CS/0004" },
  { id: "TX-1005", date: "2026-03-04", school: "College of Law", amount: 30000, status: "refunded", reference: "REF-3M4N5O", student: "2023/PG/SCS/CS/0005" },
  { id: "TX-1006", date: "2026-03-05", school: "College of Arts", amount: 18000, status: "success", reference: "REF-6P7Q8R", student: "2023/PG/SCS/CS/0006" },
];

const payoutsSeed: Payout[] = [
  { id: "PO-001", school: "College of Science", amount: 120000, date: "2026-03-01", status: "paid" },
  { id: "PO-002", school: "College of Engineering", amount: 95000, date: "2026-03-02", status: "processing" },
  { id: "PO-003", school: "College of Medicine", amount: 60000, date: "2026-03-03", status: "queued" },
];

const refundsSeed: RefundRequest[] = [
  { id: "RR-01", txnId: "TX-1005", school: "College of Law", amount: 30000, reason: "Duplicate charge", status: "open", date: "2026-03-04" },
  { id: "RR-02", txnId: "TX-1010", school: "College of Arts", amount: 15000, reason: "Wrong amount", status: "resolved", date: "2026-03-02" },
];

export default function Payments() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [txns, setTxns] = useState<Transaction[]>(txnsSeed);
  const [refunds, setRefunds] = useState<RefundRequest[]>(refundsSeed);
  const [payouts] = useState<Payout[]>(payoutsSeed);

  const filteredTxns = useMemo(() => {
    if (!query.trim()) return txns;
    const q = query.toLowerCase();
    return txns.filter(
      t =>
        t.id.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        t.school.toLowerCase().includes(q) ||
        t.student.toLowerCase().includes(q)
    );
  }, [txns, query]);

  const revenueBySchool = useMemo(() => {
    const map = new Map<string, number>();
    txns.forEach(t => {
      if (t.status === "success") {
        map.set(t.school, (map.get(t.school) || 0) + t.amount);
      }
    });
    return Array.from(map.entries()).map(([school, revenue]) => ({ school, revenue }));
  }, [txns]);

  const failedTxns = useMemo(() => txns.filter(t => t.status === "failed"), [txns]);

  const handleResolveRefund = (id: string) => {
    setRefunds(prev => prev.map(r => (r.id === id ? { ...r, status: "resolved" } : r)));
    toast({ title: "Refund marked as resolved" });
  };

  const downloadPayoutsCsv = () => {
    const header = ["Payout ID", "School", "Amount", "Date", "Status"];
    const rows = payouts.map(p => [p.id, p.school, String(p.amount), p.date, p.status]);
    const csv = [header, ...rows].map(r => r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "payouts.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Payout report downloaded" });
  };

  const downloadInvoice = (t: Transaction) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Payment Invoice", 14, 20);
    doc.setFontSize(12);
    doc.text(`Invoice ID: ${t.id}`, 14, 35);
    doc.text(`Reference: ${t.reference}`, 14, 45);
    doc.text(`Student: ${t.student}`, 14, 55);
    doc.text(`School: ${t.school}`, 14, 65);
    doc.text(`Date: ${t.date}`, 14, 75);
    doc.text(`Amount: ₦${t.amount.toLocaleString()}`, 14, 85);
    doc.text(`Status: ${t.status}`, 14, 95);
    doc.save(`${t.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Payments</h2>
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search transactions by ID, ref, student or school"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">All Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-gray-600 text-sm font-medium">Date</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Txn ID</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Ref</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">School</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Student</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Amount</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Status</th>
                    <th className="p-3 text-gray-600 text-sm font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTxns.map((t, i) => (
                    <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-amber-50"}>
                      <td className="p-3">{t.date}</td>
                      <td className="p-3">{t.id}</td>
                      <td className="p-3">{t.reference}</td>
                      <td className="p-3">{t.school}</td>
                      <td className="p-3">{t.student}</td>
                      <td className="p-3">₦{t.amount.toLocaleString()}</td>
                      <td className="p-3 capitalize">{t.status}</td>
                      <td className="p-3">
                        <Button size="sm" className="bg-amber-700 text-white" onClick={() => downloadInvoice(t)}>
                          Invoice
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredTxns.length === 0 && (
                    <tr>
                      <td className="p-6 text-center text-gray-500" colSpan={8}>No transactions</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by School</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBySchool} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="school" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Failed Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-gray-600 text-sm font-medium">Date</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Txn ID</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">School</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {failedTxns.map((t, i) => (
                    <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-amber-50"}>
                      <td className="p-3">{t.date}</td>
                      <td className="p-3">{t.id}</td>
                      <td className="p-3">{t.school}</td>
                      <td className="p-3">₦{t.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {failedTxns.length === 0 && (
                    <tr>
                      <td className="p-6 text-center text-gray-500" colSpan={4}>No failed payments</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Refund Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-gray-600 text-sm font-medium">Date</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Txn ID</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">School</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Amount</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Status</th>
                    <th className="p-3 text-gray-600 text-sm font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((r, i) => (
                    <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-amber-50"}>
                      <td className="p-3">{r.date}</td>
                      <td className="p-3">{r.txnId}</td>
                      <td className="p-3">{r.school}</td>
                      <td className="p-3">₦{r.amount.toLocaleString()}</td>
                      <td className="p-3 capitalize">{r.status}</td>
                      <td className="p-3">
                        {r.status === "open" ? (
                          <Button size="sm" className="bg-amber-700 text-white" onClick={() => handleResolveRefund(r.id)}>
                            Mark Resolved
                          </Button>
                        ) : (
                          ""
                        )}
                      </td>
                    </tr>
                  ))}
                  {refunds.length === 0 && (
                    <tr>
                      <td className="p-6 text-center text-gray-500" colSpan={6}>No refund requests</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Payout Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-3">
              <Button className="bg-amber-700 text-white" onClick={downloadPayoutsCsv}>Download CSV</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-gray-600 text-sm font-medium">Payout ID</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">School</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Amount</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Date</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p, i) => (
                    <tr key={p.id} className={i % 2 === 0 ? "bg-white" : "bg-amber-50"}>
                      <td className="p-3">{p.id}</td>
                      <td className="p-3">{p.school}</td>
                      <td className="p-3">₦{p.amount.toLocaleString()}</td>
                      <td className="p-3">{p.date}</td>
                      <td className="p-3 capitalize">{p.status}</td>
                    </tr>
                  ))}
                  {payouts.length === 0 && (
                    <tr>
                      <td className="p-6 text-center text-gray-500" colSpan={5}>No payout reports</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
