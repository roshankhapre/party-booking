"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testName, setTestName] = useState("");
  const [testTemplate, setTestTemplate] = useState("BOOKING_CONFIRMATION");
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (testModalOpen) {
      // Fetch preview
      const fetchPreview = async () => {
        try {
          const res = await fetch("/api/whatsapp/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: testPhone,
              name: testName,
              templateType: testTemplate,
              action: "preview",
            }),
          });
          const data = await res.json();
          if (data.success) {
            setPreview(data.preview);
          }
        } catch (e) {
          console.error("Failed to fetch preview");
        }
      };
      fetchPreview();
    }
  }, [testPhone, testName, testTemplate, testModalOpen]);

  const handleTestWhatsApp = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          name: testName,
          templateType: testTemplate,
          action: "send",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          type: "success",
          message: data.message,
          mode: data.mode,
        });
      } else {
        setTestResult({ type: "error", message: "Error: " + data.error });
      }
    } catch (e: any) {
      setTestResult({ type: "error", message: "Failed to send test request." });
    }
    setTesting(false);
  };

  return (
    <div className="p-3 md:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure the core parameters of your booking system.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pricing Configurations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Advance Amount (₹)</Label>
                <Input defaultValue="2000" />
              </div>
              <div className="space-y-2">
                <Label>Extra Hall Charge (₹)</Label>
                <Input defaultValue="500" />
              </div>
              <div className="space-y-2">
                <Label>Extra Buffet Charge Per Head (₹)</Label>
                <Input defaultValue="150" />
              </div>
              <div className="space-y-2">
                <Label>Minimum Members for Full Hall</Label>
                <Input defaultValue="40" type="number" />
              </div>
            </div>
            <div className="pt-4 border-t mt-4 flex justify-end">
              <Button>Save Pricing</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>WhatsApp API Configuration</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestModalOpen(true)}
            >
              Test WhatsApp
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Token</Label>
              <Input
                defaultValue={
                  process.env.NEXT_PUBLIC_WHATSAPP_API_TOKEN || "MOCK_TOKEN"
                }
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number ID</Label>
              <Input
                defaultValue={
                  process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID || ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Admin WhatsApp Number</Label>
              <Input
                defaultValue={
                  process.env.NEXT_PUBLIC_WHATSAPP_ADMIN_NUMBER || ""
                }
              />
            </div>
            <div className="pt-4 border-t mt-4 flex justify-end">
              <Button>Save Integrations</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Test WhatsApp Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Customer Phone Number</Label>
              <div className="flex">
                <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground">
                  +91
                </div>
                <Input
                  className="rounded-l-none"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Customer Name</Label>
              <Input
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
              />
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={testTemplate} onValueChange={setTestTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOOKING_CONFIRMATION">
                    Booking Confirmed
                  </SelectItem>
                  <SelectItem value="THREE_DAYS_BEFORE">
                    3 Days Before
                  </SelectItem>
                  <SelectItem value="ONE_DAY_BEFORE">1 Day Before</SelectItem>
                  <SelectItem value="DAY_OF">Day Of Event</SelectItem>
                  <SelectItem value="THANK_YOU">Thank You</SelectItem>
                  <SelectItem value="ADMIN_DAILY_SUMMARY">
                    Admin Daily Summary
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {preview && !testResult && (
              <div className="space-y-2">
                <Label>Message Preview</Label>
                <div className="p-4 bg-muted rounded-md border border-border overflow-auto max-h-48 whitespace-pre-wrap text-sm text-muted-foreground">
                  {preview}
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleTestWhatsApp}
              disabled={testing}
            >
              {testing ? "Sending Test..." : "Send Test Message"}
            </Button>

            {testResult && (
              <div
                className={`mt-4 p-4 rounded-md border overflow-auto max-h-64 whitespace-pre-wrap text-sm ${testResult.type === "success" ? "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-900 dark:text-green-200" : "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-900 dark:text-red-200"}`}
              >
                {testResult.type === "success" ? (
                  <>
                    <strong>Success! (Mode: {testResult.mode})</strong>
                    <br />
                    <br />
                    {testResult.message}
                  </>
                ) : (
                  testResult.message
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
