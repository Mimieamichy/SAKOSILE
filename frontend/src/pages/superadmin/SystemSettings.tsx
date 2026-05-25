import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

type Pricing = { applicationFee: number; defenseFee: number; currency: string };
type Gateway = { provider: string; publicKey: string; webhookUrl: string; sandbox: boolean };
type EmailTemplate = { id: string; name: string; subject: string; body: string };
type Branding = { appName: string; primaryColor: string; logoUrl: string };
type Toggles = { payments: boolean; analytics: boolean; notifications: boolean };
type Maintenance = { enabled: boolean; message: string };
type ApiKey = { id: string; label: string; key: string; active: boolean };

const emailSeed: EmailTemplate[] = [
  { id: "tmpl-1", name: "Welcome", subject: "Welcome to the Platform", body: "Hello {{name}}, welcome." },
  { id: "tmpl-2", name: "Payment Receipt", subject: "Your Payment Receipt", body: "Hi {{name}}, payment confirmed." },
];

export default function SystemSettings() {
  const { toast } = useToast();
  const [pricing, setPricing] = useState<Pricing>({ applicationFee: 10000, defenseFee: 15000, currency: "NGN" });
  const [gateway, setGateway] = useState<Gateway>({ provider: "Paystack", publicKey: "pk_test_xxx", webhookUrl: "https://example.com/webhook", sandbox: true });
  const [emails, setEmails] = useState<EmailTemplate[]>(emailSeed);
  const [selectedEmailId, setSelectedEmailId] = useState<string>(emails[0].id);
  const [branding, setBranding] = useState<Branding>({ appName: "PG Management", primaryColor: "#F59E0B", logoUrl: "https://placehold.co/120x40?text=Logo" });
  const [toggles, setToggles] = useState<Toggles>({ payments: true, analytics: true, notifications: true });
  const [maintenance, setMaintenance] = useState<Maintenance>({ enabled: false, message: "We are undergoing maintenance. Please check back soon." });
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: "k1", label: "Default Public Key", key: "pk_live_************************", active: true },
    { id: "k2", label: "Webhook Signing", key: "whsec_************************", active: true },
  ]);

  const selectedEmail = useMemo(() => emails.find(e => e.id === selectedEmailId)!, [emails, selectedEmailId]);

  const savePricing = () => toast({ title: "Pricing saved" });
  const saveGateway = () => toast({ title: "Payment gateway saved" });
  const saveEmails = () => toast({ title: "Email template saved" });
  const saveBranding = () => toast({ title: "Branding saved" });
  const saveToggles = () => toast({ title: "Feature toggles updated" });
  const saveMaintenance = () => toast({ title: "Maintenance settings updated" });

  const generateKey = () => {
    const id = `k-${Date.now()}`;
    const key = `pk_demo_${Math.random().toString(36).slice(2, 10)}*************`;
    setApiKeys(prev => [{ id, label: "New Key", key, active: true }, ...prev]);
    toast({ title: "API key generated" });
  };
  const toggleKey = (id: string) => {
    setApiKeys(prev => prev.map(k => (k.id === id ? { ...k, active: !k.active } : k)));
    toast({ title: "API key status updated" });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Application Fee</Label>
              <Input
                type="number"
                value={pricing.applicationFee}
                onChange={e => setPricing({ ...pricing, applicationFee: Number(e.target.value || 0) })}
              />
            </div>
            <div>
              <Label>Defense Fee</Label>
              <Input
                type="number"
                value={pricing.defenseFee}
                onChange={e => setPricing({ ...pricing, defenseFee: Number(e.target.value || 0) })}
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={pricing.currency} onChange={e => setPricing({ ...pricing, currency: e.target.value })} />
            </div>
            <Button className="bg-amber-700 text-white" onClick={savePricing}>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Gateway Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Provider</Label>
              <Input value={gateway.provider} onChange={e => setGateway({ ...gateway, provider: e.target.value })} />
            </div>
            <div>
              <Label>Public Key</Label>
              <Input value={gateway.publicKey} onChange={e => setGateway({ ...gateway, publicKey: e.target.value })} />
            </div>
            <div>
              <Label>Webhook URL</Label>
              <Input value={gateway.webhookUrl} onChange={e => setGateway({ ...gateway, webhookUrl: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={gateway.sandbox} onCheckedChange={v => setGateway({ ...gateway, sandbox: Boolean(v) })} />
              <span className="text-sm text-gray-600">Sandbox Mode</span>
            </div>
            <Button className="bg-amber-700 text-white" onClick={saveGateway}>Save</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Email Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Template</Label>
              <select
                className="w-full border rounded-md h-10 px-3"
                value={selectedEmailId}
                onChange={e => setSelectedEmailId(e.target.value)}
              >
                {emails.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={selectedEmail.subject}
                onChange={e => setEmails(prev => prev.map(t => t.id === selectedEmailId ? { ...t, subject: e.target.value } : t))}
              />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                rows={6}
                value={selectedEmail.body}
                onChange={e => setEmails(prev => prev.map(t => t.id === selectedEmailId ? { ...t, body: e.target.value } : t))}
              />
            </div>
            <Button className="bg-amber-700 text-white" onClick={saveEmails}>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Application Name</Label>
              <Input value={branding.appName} onChange={e => setBranding({ ...branding, appName: e.target.value })} />
            </div>
            <div>
              <Label>Primary Color</Label>
              <Input value={branding.primaryColor} onChange={e => setBranding({ ...branding, primaryColor: e.target.value })} />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input value={branding.logoUrl} onChange={e => setBranding({ ...branding, logoUrl: e.target.value })} />
            </div>
            <Button className="bg-amber-700 text-white" onClick={saveBranding}>Save</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Toggles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Payments</span>
              <Switch checked={toggles.payments} onCheckedChange={v => setToggles({ ...toggles, payments: Boolean(v) })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Analytics</span>
              <Switch checked={toggles.analytics} onCheckedChange={v => setToggles({ ...toggles, analytics: Boolean(v) })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Notifications</span>
              <Switch checked={toggles.notifications} onCheckedChange={v => setToggles({ ...toggles, notifications: Boolean(v) })} />
            </div>
            <Button className="bg-amber-700 text-white" onClick={saveToggles}>Save</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maintenance Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch checked={maintenance.enabled} onCheckedChange={v => setMaintenance({ ...maintenance, enabled: Boolean(v) })} />
              <span className="text-sm text-gray-700">{maintenance.enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                rows={4}
                value={maintenance.message}
                onChange={e => setMaintenance({ ...maintenance, message: e.target.value })}
              />
            </div>
            <Button className="bg-amber-700 text-white" onClick={saveMaintenance}>Save</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">API Keys</CardTitle>
            <Button className="bg-amber-700 text-white" onClick={generateKey}>Generate New Key</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-gray-600 text-sm font-medium">Label</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Key</th>
                    <th className="p-3 text-gray-600 text-sm font-medium">Status</th>
                    <th className="p-3 text-gray-600 text-sm font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((k, i) => (
                    <tr key={k.id} className={i % 2 === 0 ? "bg-white" : "bg-amber-50"}>
                      <td className="p-3">
                        <Input
                          value={k.label}
                          onChange={e => setApiKeys(prev => prev.map(x => x.id === k.id ? { ...x, label: e.target.value } : x))}
                        />
                      </td>
                      <td className="p-3 font-mono">{k.key}</td>
                      <td className="p-3">{k.active ? "Active" : "Disabled"}</td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          className={`${k.active ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"} text-white`}
                          onClick={() => toggleKey(k.id)}
                        >
                          {k.active ? "Disable" : "Enable"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {apiKeys.length === 0 && (
                    <tr>
                      <td className="p-6 text-center text-gray-500" colSpan={4}>
                        No API keys
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
