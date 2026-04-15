export interface SendEmailDto {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailTemplate {
  templateId: string;
  dynamicTemplateData: Record<string, any>;
}

export interface SendEmailWithTemplateDto {
  to: string | string[];
  template: EmailTemplate;
  from?: string;
}
