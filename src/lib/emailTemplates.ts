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
    name: "Follow-Up (Day 7)",
    subject: "Follow-Up: Loss Run Request – {{client_name}} ({{coverage_type}})",
    body: `Dear Loss Runs Department,

This is a follow-up to our loss run request submitted approximately one week ago. We have not yet received the requested documents and wanted to check in.

Insured: {{client_name}}
Policy Number: {{policy_number}}
Line of Business: {{coverage_type}}
Policy Period: {{policy_period}}

Please provide the most recent five years of loss history at your earliest convenience. If there is anything else needed to process this request, please let us know.

Thank you,
{{sender_name}}
{{agency_name}}

Sent via InsureOps`,
  },
  {
    id: "second_follow_up",
    name: "Second Follow-Up (Day 14)",
    subject: "Second Follow-Up: Loss Run Request – {{client_name}} ({{coverage_type}})",
    body: `Dear Loss Runs Department,

We are following up again regarding our pending loss run request for the insured listed below. This is our second follow-up and we have not yet received the requested documents.

Insured: {{client_name}}
Policy Number: {{policy_number}}
Line of Business: {{coverage_type}}
Policy Period: {{policy_period}}

Please be advised that we are working on an upcoming renewal for this account and timely receipt of the loss runs is important to this process. We would appreciate your prompt attention to this matter.

If there are any issues fulfilling this request, please contact us immediately.

Thank you,
{{sender_name}}
{{agency_name}}

Sent via InsureOps`,
  },
  {
    id: "final_notice",
    name: "Final Notice (Day 21+)",
    subject: "URGENT – Final Notice: Loss Run Request – {{client_name}} ({{coverage_type}})",
    body: `Dear Loss Runs Department,

This is our final follow-up regarding the outstanding loss run request listed below. Despite our previous requests, we have not yet received the required documents.

Insured: {{client_name}}
Policy Number: {{policy_number}}
Line of Business: {{coverage_type}}
Policy Period: {{policy_period}}

We are requesting that this matter be escalated within your organization. The continued delay is impacting our client's renewal process. If we do not receive the loss runs within the next 5 business days, we will need to notify our client of the delay and explore alternative options.

Please contact us immediately to resolve this matter.

Thank you,
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

export function getFollowUpTemplate(followUpNumber: number): EmailTemplate {
  if (followUpNumber >= 3) return emailTemplates[3]; // final_notice
  if (followUpNumber === 2) return emailTemplates[2]; // second_follow_up
  return emailTemplates[1]; // follow_up (day 7)
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
