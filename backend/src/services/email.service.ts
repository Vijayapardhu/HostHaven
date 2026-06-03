import nodemailer from "nodemailer";
import { config } from "../config";
import { logger } from "../utils/logger.util";
import { prisma } from "../config/database";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: {
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }[];
}

// Cache for database templates to avoid querying on every email
let templateCache: Record<string, { html: string; text: string; updatedAt: Date }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Fallback hardcoded templates for essential system emails (in case database is unavailable)
const fallbackTemplates: Record<string, { html: string; text: string }> = {
  "email-verification": {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d4a574;">Welcome to HostHaven!</h2>
        <p>Hello {{name}},</p>
        <p>Thank you for registering with HostHaven. Please verify your email address to get started.</p>
        <a href="{{verificationUrl}}" style="display: inline-block; padding: 12px 24px; background: #d4a574; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Verify Email Address
        </a>
        <p style="color: #666;">This link will expire in {{expiresIn}}.</p>
        <p style="color: #999; font-size: 12px;">If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
    text: `
      Welcome to HostHaven!
      
      Hello {{name}},
      
      Thank you for registering with HostHaven. Please verify your email address by visiting:
      {{verificationUrl}}
      
      This link will expire in {{expiresIn}}.
      
      If you didn't create an account, you can ignore this email.
    `,
  },
  "password-reset": {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d4a574;">Password Reset</h2>
        <p>Hello {{name}},</p>
        <p>We received a request to reset your password. Click the button below to create a new password.</p>
        <a href="{{resetUrl}}" style="display: inline-block; padding: 12px 24px; background: #d4a574; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #666;">This link will expire in {{expiresIn}}.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request a password reset, you can ignore this email.</p>
      </div>
    `,
    text: `
      Password Reset
      
      Hello {{name}},
      
      We received a request to reset your password. Please visit:
      {{resetUrl}}
      
      This link will expire in {{expiresIn}}.
      
      If you didn't request a password reset, you can ignore this email.
    `,
  },
  "welcome": {
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d4a574;">Welcome to HostHaven!</h2>
        <p>Hello {{name}},</p>
        <p>Your account has been created successfully. You can now explore Andhra Pradesh's heritage destinations!</p>
        <a href="{{loginUrl}}" style="display: inline-block; padding: 12px 24px; background: #d4a574; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Start Exploring
        </a>
      </div>
    `,
    text: `
      Welcome to HostHaven!
      
      Hello {{name}},
      
      Your account has been created successfully. Start exploring Andhra Pradesh's heritage destinations!
      
      Visit: {{loginUrl}}
    `,
  }
};

// Helper function to replace placeholders in template strings
function interpolate(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = data[key];
    return value !== null && value !== undefined ? value : "";
  });
}

// Get template from database with caching
async function getTemplateFromDatabase(name: string): Promise<{ html: string; text: string } | null> {
  try {
    // Check cache first
    const cached = templateCache[name];
    if (cached && (Date.now() - cached.updatedAt.getTime()) < CACHE_TTL) {
      return { html: cached.html, text: cached.text };
    }

    // Fetch from database
    const template = await prisma.emailTemplate.findUnique({
      where: { name },
    });

    if (!template) {
      return null;
    }

    // Update cache
    templateCache[name] = {
      html: template.html,
      text: template.text,
      updatedAt: new Date(),
    };

    return { html: template.html, text: template.text };
  } catch (error) {
    logger.error({ error, name }, "Failed to fetch email template from database");
    return null;
  }
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Try to get template from database, fall back to hardcoded if not found
    let template = await getTemplateFromDatabase(options.template);
    let isFallback = false;

    if (!template) {
      template = fallbackTemplates[options.template];
      isFallback = !!template;
    }

    if (!template) {
      logger.error({ template: options.template }, "Email template not found in database or fallback");
      return false;
    }

    // Interpolate placeholders
    const html = interpolate(template.html, options.data);
    const text = interpolate(template.text, options.data);

    await transporter.sendMail({
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      html,
      text,
      attachments: options.attachments,
    });

    logger.info(
      { to: options.to, template: options.template, fallback: isFallback },
      "Email sent successfully"
    );
    return true;
  } catch (error) {
    logger.error({ error, to: options.to }, "Failed to send email");
    return false;
  }
};

export default { sendEmail };