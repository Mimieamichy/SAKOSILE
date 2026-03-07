import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

type TicketType = "technical" | "billing" | "other";
type TicketStatus = "open" | "resolved";

type Ticket = {
  id: string;
  school: string;
  type: TicketType;
  subject: string;
  message: string;
  date: string;
  status: TicketStatus;
  contact: string;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  date: string;
  published: boolean;
};

const seedTickets: Ticket[] = [
  {
    id: "T-1001",
    school: "College of Science",
    type: "technical",
    subject: "Cannot upload defense document",
    message: "Students report a 500 error during upload.",
    date: "2026-03-02",
    status: "open",
    contact: "science-admin@example.com",
  },
  {
    id: "T-1002",
    school: "College of Law",
    type: "billing",
    subject: "Double debit on payment",
    message: "Two charges for a single transaction.",
    date: "2026-03-03",
    status: "open",
    contact: "law-admin@example.com",
  },
  {
    id: "T-1003",
    school: "College of Engineering",
    type: "technical",
    subject: "Defense page not loading",
    message: "Timeout when opening defense schedule.",
    date: "2026-03-03",
    status: "resolved",
    contact: "eng-admin@example.com",
  },
  {
    id: "T-1004",
    school: "College of Arts",
    type: "other",
    subject: "Requesting feature: bulk student import",
    message: "We would like a CSV import for registrations.",
    date: "2026-03-04",
    status: "open",
    contact: "arts-admin@example.com",
  },
];

export default function Support() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>(seedTickets);
  const [tab, setTab] = useState<"all" | "technical" | "billing">("all");

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { id: "ANN-1", title: "System Update Tonight", body: "Maintenance from 11pm–1am WAT.", date: "2026-03-01", published: true },
    { id: "ANN-2", title: "New Payment Flow", body: "We introduced a simplified payment page.", date: "2026-03-03", published: false },
  ]);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");

  const filteredTickets = useMemo(() => {
    let list = tickets;
    if (tab !== "all") {
      list = list.filter((t) => t.type === tab);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.school.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.contact.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tickets, tab, query]);

  const markResolved = (id: string) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: "resolved" } : t)));
    toast({ title: "Ticket marked as resolved" });
  };

  const reopenTicket = (id: string) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: "open" } : t)));
    toast({ title: "Ticket reopened" });
  };

  const createAnnouncement = () => {
    if (!newTitle.trim() || !newBody.trim()) {
      toast({ title: "Title and message required", variant: "destructive" });
      return;
    }
    const ann: Announcement = {
      id: `ANN-${Date.now()}`,
      title: newTitle.trim(),
      body: newBody.trim(),
      date: new Date().toISOString().slice(0, 10),
      published: false,
    };
    setAnnouncements((prev) => [ann, ...prev]);
    setNewTitle("");
    setNewBody("");
    toast({ title: "Announcement created" });
  };

  const togglePublish = (id: string) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, published: !a.published } : a)));
    toast({ title: "Announcement updated" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Support</h2>
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search tickets by ID, school, subject or contact"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Support Requests from Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="technical">Technical Issues</TabsTrigger>
                <TabsTrigger value="billing">Billing Disputes</TabsTrigger>
              </TabsList>
              <TabsContent value="all" />
              <TabsContent value="technical" />
              <TabsContent value="billing" />
            </Tabs>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-gray-600 text-sm font-medium">Date</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Ticket</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">School</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Type</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Subject</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Status</th>
                    <th className="p-3 text-gray-600 text-sm font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((t, i) => (
                    <tr key={t.id} className={i % 2 === 0 ? "bg-white" : "bg-amber-50"}>
                      <td className="p-3">{t.date}</td>
                      <td className="p-3">{t.id}</td>
                      <td className="p-3">{t.school}</td>
                      <td className="p-3 capitalize">{t.type}</td>
                      <td className="p-3">{t.subject}</td>
                      <td className="p-3 capitalize">{t.status}</td>
                      <td className="p-3">
                        {t.status === "open" ? (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => markResolved(t.id)}>
                            Mark Resolved
                          </Button>
                        ) : (
                          <Button size="sm" className="bg-amber-700 text-white" onClick={() => reopenTicket(t.id)}>
                            Reopen
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td className="p-6 text-center text-gray-500" colSpan={7}>
                        No tickets
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Scheduled Maintenance" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea rows={4} value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Announcement message" />
            </div>
            <Button className="bg-amber-700 text-white" onClick={createAnnouncement}>
              Create Announcement
            </Button>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-gray-600 text-sm font-medium">Date</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Title</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Published</th>
                    <th className="p-3 text-gray-600 text-sm font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((a, i) => (
                    <tr key={a.id} className={i % 2 === 0 ? "bg-white" : "bg-amber-50"}>
                      <td className="p-3">{a.date}</td>
                      <td className="p-3">{a.title}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Switch checked={a.published} onCheckedChange={() => togglePublish(a.id)} />
                          <span className="text-sm text-gray-600">{a.published ? "Published" : "Draft"}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <details>
                          <summary className="cursor-pointer text-sm text-amber-700">Preview</summary>
                          <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">{a.body}</div>
                        </details>
                      </td>
                    </tr>
                  ))}
                  {announcements.length === 0 && (
                    <tr>
                      <td className="p-6 text-center text-gray-500" colSpan={4}>
                        No announcements
                      </td>
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
