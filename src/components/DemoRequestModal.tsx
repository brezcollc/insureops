import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

interface DemoRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DemoRequestModal = ({ open, onOpenChange }: DemoRequestModalProps) => {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !company.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in your name, company, and email.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const notes = [
        `Name: ${name.trim()}`,
        `Company: ${company.trim()}`,
        message.trim() ? `Message: ${message.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const { error } = await supabase
        .from("interest_signups")
        .insert({ email: trimmedEmail, notes });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already submitted",
            description: "We already have your inquiry on file. We'll be in touch soon.",
          });
          setIsSubmitted(true);
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
        toast({
          title: "Inquiry received",
          description: "We'll be in touch shortly.",
        });

        const timestamp = new Date().toISOString();
        supabase.functions
          .invoke("notify-signup", {
            body: { email: trimmedEmail, timestamp },
          })
          .catch((err) => {
            console.error("Failed to send admin notification:", err);
          });
      }
    } catch (error) {
      console.error("Demo request error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      // Reset form on close
      setTimeout(() => {
        setName("");
        setCompany("");
        setEmail("");
        setMessage("");
        setIsSubmitted(false);
      }, 200);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md rounded-2xl border"
        style={{
          background: "hsl(215 45% 11%)",
          borderColor: "hsl(215 30% 20%)",
        }}
      >
        {isSubmitted ? (
          <div className="py-8 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "hsla(152, 55%, 42%, 0.15)" }}
            >
              <CheckCircle className="w-7 h-7" style={{ color: "hsl(152 55% 45%)" }} />
            </div>
            <p className="font-semibold text-xl" style={{ color: "hsl(210 20% 93%)" }}>
              Thank you
            </p>
            <p className="mt-2 text-sm" style={{ color: "hsl(210 15% 55%)" }}>
              We've received your inquiry and will be in touch shortly.
            </p>
            <Button
              onClick={() => handleOpenChange(false)}
              className="mt-6 rounded-xl px-6"
              style={{
                background: "hsl(215 30% 20%)",
                color: "hsl(210 20% 80%)",
              }}
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle
                className="text-xl font-bold"
                style={{ color: "hsl(210 20% 93%)" }}
              >
                Request a Demo
              </DialogTitle>
              <DialogDescription style={{ color: "hsl(210 15% 55%)" }}>
                Tell us about your brokerage and we'll schedule a walkthrough.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label
                  htmlFor="demo-name"
                  className="text-sm font-medium"
                  style={{ color: "hsl(210 15% 65%)" }}
                >
                  Name <span style={{ color: "hsl(0 84% 60%)" }}>*</span>
                </Label>
                <Input
                  id="demo-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  maxLength={100}
                  disabled={isSubmitting}
                  className="rounded-lg"
                  style={{
                    background: "hsl(215 40% 14%)",
                    borderColor: "hsl(215 30% 22%)",
                    color: "hsl(210 20% 90%)",
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="demo-company"
                  className="text-sm font-medium"
                  style={{ color: "hsl(210 15% 65%)" }}
                >
                  Brokerage / Company <span style={{ color: "hsl(0 84% 60%)" }}>*</span>
                </Label>
                <Input
                  id="demo-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your company name"
                  maxLength={150}
                  disabled={isSubmitting}
                  className="rounded-lg"
                  style={{
                    background: "hsl(215 40% 14%)",
                    borderColor: "hsl(215 30% 22%)",
                    color: "hsl(210 20% 90%)",
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="demo-email"
                  className="text-sm font-medium"
                  style={{ color: "hsl(210 15% 65%)" }}
                >
                  Work Email <span style={{ color: "hsl(0 84% 60%)" }}>*</span>
                </Label>
                <Input
                  id="demo-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@brokerage.com"
                  maxLength={255}
                  disabled={isSubmitting}
                  className="rounded-lg"
                  style={{
                    background: "hsl(215 40% 14%)",
                    borderColor: "hsl(215 30% 22%)",
                    color: "hsl(210 20% 90%)",
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="demo-message"
                  className="text-sm font-medium"
                  style={{ color: "hsl(210 15% 65%)" }}
                >
                  Message <span style={{ color: "hsl(210 15% 45%)" }}>(optional)</span>
                </Label>
                <Textarea
                  id="demo-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your loss run workflow or any questions you have"
                  maxLength={1000}
                  rows={3}
                  disabled={isSubmitting}
                  className="rounded-lg resize-none"
                  style={{
                    background: "hsl(215 40% 14%)",
                    borderColor: "hsl(215 30% 22%)",
                    color: "hsl(210 20% 90%)",
                  }}
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl text-base font-semibold transition-all duration-200"
                style={{
                  background: "hsl(205 80% 55%)",
                  color: "white",
                  boxShadow: "0 4px 20px hsla(205, 80%, 55%, 0.3)",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting…
                  </>
                ) : (
                  "Submit Inquiry"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DemoRequestModal;
