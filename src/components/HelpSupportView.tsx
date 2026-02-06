import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, HelpCircle, Mail, AlertCircle } from "lucide-react";

export function HelpSupportView() {
  const quickStartSteps = [
    { step: "Add a client", description: "Create client records with contact info and renewal dates" },
    { step: "Add policies", description: "Link policies to clients with carrier and coverage details" },
    { step: "Request loss runs", description: "Send loss run requests to carriers via email" },
    { step: "Upload documents", description: "Attach received loss run documents to requests" },
    { step: "Review and complete", description: "Mark requests as reviewed once processed" },
  ];

  const faqs = [
    {
      question: "What happens after I request a loss run?",
      answer: "An email is sent to the carrier's loss run department. The request status changes to 'Requested' and you can track it from the dashboard or client detail view."
    },
    {
      question: "How do follow-ups work?",
      answer: "You can manually send follow-up emails from the request detail view. Each follow-up is logged and the status updates to 'Follow-up Sent' to help you track communication history."
    },
    {
      question: "Can I upload multiple documents?",
      answer: "Yes, you can upload multiple documents to a single loss run request. Each document is stored and associated with that specific request for easy reference."
    },
    {
      question: "What does 'Reviewed' mean?",
      answer: "Marking a request as 'Reviewed' indicates that someone has examined the received loss run documents. This locks the request from further edits and helps track completion."
    },
    {
      question: "How do I edit client or policy information?",
      answer: "Navigate to the client detail view and use the edit buttons on the Overview or Policies tabs. Changes are saved immediately."
    },
    {
      question: "What email templates are available?",
      answer: "Two templates are provided: 'Initial Loss Run Request' for first-time requests, and 'Follow-Up Loss Run Request' for subsequent communications. You can edit the content before sending."
    },
  ];

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground">Help & Support</h2>
        <p className="text-muted-foreground">Get started and find answers to common questions</p>
      </div>

      <div className="space-y-6">
        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Quick Start Guide</CardTitle>
            </div>
            <CardDescription>
              Get up and running with InsureOps in a few simple steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {quickStartSteps.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{item.step}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Common Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Common Questions</CardTitle>
            </div>
            <CardDescription>
              Answers to frequently asked questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-sm">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Support & Contact */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Support & Contact</CardTitle>
            </div>
            <CardDescription>
              Need help? Here's how to reach us
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">support@insureops.com</p>
                <p className="text-xs text-muted-foreground">We typically respond within 24 hours</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              For questions or issues, email us and include the client name or request ID to help us assist you faster.
            </p>
          </CardContent>
        </Card>

        {/* Product Scope Clarification */}
        <Card className="border-muted">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg text-muted-foreground">About This Application</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              InsureOps helps manage loss run requests and documents. It streamlines the process of requesting, tracking, and organizing loss runs from insurance carriers.
            </p>
            <Separator className="my-3" />
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> This application does not analyze, interpret, or provide advice on insurance data. All insurance decisions should be made by qualified professionals.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
