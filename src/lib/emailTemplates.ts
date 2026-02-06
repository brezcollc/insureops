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
    subject: "Loss Run Request - {{client_name}} - Policy {{policy_number}}",
    body: `Dear Loss Runs Department,

We are writing to request loss run information for the following insured:

Insured Name: {{client_name}}
Policy Number: {{policy_number}}
Coverage Type: {{coverage_type}}
Policy Period: {{policy_period}}

Please provide loss runs covering the most recent 5 years of coverage history, including:
- All open and closed claims
- Claim numbers, dates of loss, and descriptions
- Paid, reserved, and incurred amounts
- Current claim status

If you have any questions or need additional information to process this request, please do not hesitate to contact us.

Thank you for your prompt attention to this request.

Best regards,
{{sender_name}}
{{agency_name}}`,
  },
  {
    id: "follow_up",
    name: "Follow-Up Loss Run Request",
    subject: "FOLLOW-UP: Loss Run Request - {{client_name}} - Policy {{policy_number}}",
    body: `Dear Loss Runs Department,

FOLLOW-UP REQUEST

This is a follow-up to our previous loss run request. We kindly ask for your prompt attention to this matter.

Insured Name: {{client_name}}
Policy Number: {{policy_number}}
Coverage Type: {{coverage_type}}
Policy Period: {{policy_period}}

We are still awaiting the loss run information for the above-referenced policy. Your timely response is greatly appreciated as we are working on a renewal timeline.

Please provide loss runs covering the most recent 5 years of coverage history, including:
- All open and closed claims
- Claim numbers, dates of loss, and descriptions
- Paid, reserved, and incurred amounts
- Current claim status

If there is any information needed to complete this request, please let us know immediately.

Thank you for your assistance.

Best regards,
{{sender_name}}
{{agency_name}}`,
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
