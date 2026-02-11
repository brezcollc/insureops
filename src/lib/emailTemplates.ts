export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: "initial_request",
    name: "Initial Loss Run Request",
    subject: "Loss Run Request – {{client_name}} ({{coverage_type}})",
    body: `Dear Loss Runs Department,

We are requesting loss run reports for the following insured:

Insured: {{client_name}}
Policy Number: {{policy_number}}
Line of Business: {{coverage_type}}
Policy Period: {{policy_period}}

Please provide the most recent five years of loss history, including all open and closed claims with dates of loss, descriptions, paid and reserved amounts, and current status.

If any additional information is needed to fulfill this request, please let us know.

Thank you,
{{sender_name}}
{{agency_name}}

Sent via InsureOps`,
  },
  {
    id: "follow_up",
    name: "Follow-Up Loss Run Request",
    subject: "Follow-Up: Loss Run Request – {{client_name}} ({{coverage_type}})",
    body: `Dear Loss Runs Department,

This is a follow-up to our previous loss run request for the insured listed below. We would appreciate your prompt attention.

Insured: {{client_name}}
Policy Number: {{policy_number}}
Line of Business: {{coverage_type}}
Policy Period: {{policy_period}}

We are still awaiting the loss run reports for the above policy. Please provide the most recent five years of loss history at your earliest convenience.

If there is anything else needed to process this request, please let us know immediately.

Thank you for your assistance,
{{sender_name}}
{{agency_name}}

Sent via InsureOps`,
  },
];

export interface TemplateVariables {
  client_name: string;
  policy_number: string;
  coverage_type: string;
  policy_period: string;
  sender_name: string;
  agency_name: string;
}

export function applyTemplate(template: EmailTemplate, variables: TemplateVariables): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  });

  return { subject, body };
}

export function formatCoverageType(type: string): string {
  const mapping: Record<string, string> = {
    general_liability: "General Liability",
    workers_compensation: "Workers' Compensation",
    commercial_auto: "Commercial Auto",
    commercial_property: "Commercial Property",
    professional_liability: "Professional Liability",
    umbrella: "Umbrella",
    other: "Other",
  };
  return mapping[type] || type;
}
