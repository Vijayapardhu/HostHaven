import prisma from "../config/database";
import { logger } from "../utils/logger.util";

export class EmailTemplateService {
  /**
   * Get an email template by name
   * @param name The name of the template (e.g., 'booking-confirmed')
   * @returns The template object or null if not found
   */
  async getTemplateByName(name: string) {
    try {
      const template = await prisma.emailTemplate.findUnique({
        where: { name },
      });

      return template;
    } catch (error) {
      logger.error({ error, name }, 'Failed to fetch email template from database');
      return null;
    }
  }

  /**
   * Get all email templates
   * @returns Array of email templates
   */
  async getAllTemplates() {
    try {
      return await prisma.emailTemplate.findMany({
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch all email templates');
      return [];
    }
  }

  /**
   * Create a new email template
   * @param data Template data
   * @returns Created template
   */
  async createTemplate(data: {
    name: string;
    subject: string;
    html: string;
    text: string;
  }) {
    try {
      return await prisma.emailTemplate.create({
        data: {
          name: data.name,
          subject: data.subject,
          html: data.html,
          text: data.text,
        },
      });
    } catch (error) {
      logger.error({ error, data }, 'Failed to create email template');
      throw error;
    }
  }

  /**
   * Update an existing email template
   * @param id Template ID
   * @param data Template data to update
   * @returns Updated template
   */
  async updateTemplate(id: string, data: {
    subject?: string;
    html?: string;
    text?: string;
  }) {
    try {
      return await prisma.emailTemplate.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error({ error, id, data }, 'Failed to update email template');
      throw error;
    }
  }

  /**
   * Delete an email template
   * @param id Template ID
   */
  async deleteTemplate(id: string) {
    try {
      await prisma.emailTemplate.delete({
        where: { id },
      });
    } catch (error) {
      logger.error({ error, id }, 'Failed to delete email template');
      throw error;
    }
  }
}

export default new EmailTemplateService();