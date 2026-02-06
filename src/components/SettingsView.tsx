import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Building2, Mail, Settings2, Info } from "lucide-react";

export function SettingsView() {
  const [orgName, setOrgName] = useState("");
  const [defaultEmail, setDefaultEmail] = useState("");
  const [clientCodesEnabled, setClientCodesEnabled] = useState(true);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Configure your InsureOps workspace</p>
      </div>

      <div className="space-y-6">
        {/* Organization Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Organization Preferences</CardTitle>
            </div>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                placeholder="Your Agency Name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used for display purposes only
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultEmail">Default Contact Email</Label>
              <Input
                id="defaultEmail"
                type="email"
                placeholder="contact@youragency.com"
                value={defaultEmail}
                onChange={(e) => setDefaultEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional contact email for your organization
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Email Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Email Preferences</CardTitle>
            </div>
            <CardDescription>
              Email configuration and sending settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Outbound Email Provider</Label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <span className="text-sm font-medium">Resend</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Active</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Verified Sending Address</Label>
              <div className="p-3 bg-muted rounded-md">
                <span className="text-sm font-medium">noreply@resend.dev</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Emails are sent from this address when requesting loss runs.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Client Organization Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Client Preferences</CardTitle>
            </div>
            <CardDescription>
              Customize how client information is displayed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="clientCodes">Enable Client Codes</Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, client code fields are shown prominently throughout the app.
                  Existing data is preserved when disabled.
                </p>
              </div>
              <Switch
                id="clientCodes"
                checked={clientCodesEnabled}
                onCheckedChange={setClientCodesEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">System Information</CardTitle>
            </div>
            <CardDescription>
              Application details and version info
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Application</Label>
                <p className="text-sm font-medium">InsureOps</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Environment</Label>
                <p className="text-sm font-medium">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary"></span>
                    Production
                  </span>
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Version</Label>
                <p className="text-sm font-medium">1.0.0</p>
              </div>
            </div>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Last updated: February 2025
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
