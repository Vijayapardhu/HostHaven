import { prisma } from "../../src/config/database";
import { logger } from "../../src/utils/logger.util";

async function main() {
  try {
    logger.info({ action: 'seeding_email_templates' }, 'Starting email templates seeding');

    // Define the email templates to seed
    const templates = [
      {
        name: 'email-verification',
        subject: 'Verify your email address - HostHaven',
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
      {
        name: 'password-reset',
        subject: 'Reset your password - HostHaven',
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
      {
        name: 'welcome',
        subject: 'Welcome to HostHaven!',
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
      },
      {
        name: 'booking-confirmed',
        subject: 'Booking Confirmed - HostHaven',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #d4a574; margin: 0;">HostHaven</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Booking Confirmation</p>
            </div>
            
            <p>Hello <strong>{{name}}</strong>,</p>
            <p>Thank you for booking with HostHaven! Your property booking has been confirmed.</p>
            
            <div style="background: #f9f9f9; border-radius: 10px; padding: 20px; margin: 25px 0; border: 1px solid #e0e0e0;">
              <h3 style="color: #d4a574; margin-top: 0; border-bottom: 2px solid #d4a574; padding-bottom: 10px;">Booking Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 140px;"><strong>Booking ID:</strong></td>
                  <td style="padding: 8px 0; color: #333;">{{bookingId}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Property:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-weight: bold;">{{propertyName}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Check-in:</strong></td>
                  <td style="padding: 8px 0; color: #333;">{{checkIn}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Check-out:</strong></td>
                  <td style="padding: 8px 0; color: #333;">{{checkOut}}</td>
                </tr>
                {{#if roomName}}
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Room:</strong></td>
                  <td style="padding: 8px 0; color: #333;">{{roomName}}</td>
                </tr>
                {{/if}}
                {{#if guests}}
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Guests:</strong></td>
                  <td style="padding: 8px 0; color: #333;">{{adults}} Adults{{#if children}}, {{children}} Children{{/if}}</td>
                </tr>
                {{/if}}
              </table>
            </div>
            
            {{#if vendorName}}
            <div style="background: #f9f9f9; border-radius: 10px; padding: 20px; margin: 25px 0; border: 1px solid #e0e0e0;">
              <h3 style="color: #d4a574; margin-top: 0; border-bottom: 2px solid #d4a574; padding-bottom: 10px;">Host Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 140px;"><strong>Name:</strong></td>
                  <td style="padding: 8px 0; color: #333;">{{vendorName}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Location:</strong></td>
                  <td style="padding: 8px 0; color: #333;">{{vendorLocation || "N/A"}}</td>
                </tr>
                {{#if vendorPhone}}
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Phone:</strong></td>
                  <td style="padding: 8px 0; color: #333;">{{vendorPhone}}</td>
                </tr>
                {{/if}}
                {{#if vendorEmail}}
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0; color: #333;">{{vendorEmail}}</td>
                </tr>
                {{/if}}
              </table>
            </div>
            {{/if}}
            
            <div style="background: #fff8f0; border-radius: 10px; padding: 20px; margin: 25px 0; border-left: 4px solid #d4a574;">
              <h3 style="color: #d4a574; margin-top: 0;">Payment Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Total Amount:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 18px; font-weight: bold; color: #d4a574;">₹{{totalAmount}}</td>
                </tr>
                {{#if advancePaid}}
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Advance Paid:</strong></td>
                  <td style="padding: 8px 0; color: #333;>₹{{advancePaid}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Pay at Property:</strong></td>
                  <td style="padding: 8px 0; color: #333;>₹{{payAtProperty}}</td>
                </tr>
                {{/if}}
                {{#if taxAmount}}
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Tax ({{taxPercent}}%):</strong></td>
                  <td style="padding: 8px 0; color: #333;>₹{{taxAmount}}</td>
                </tr>
                {{/if}}
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Payment Status:</strong></td>
                  <td style="padding: 8px 0;><span style="background: #4caf50; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">Confirmed</span></td>
                </tr>
              </table>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                <strong>What's Next?</strong><br>
                • Your booking is confirmed and the host has been notified<br>
                • Check-in at the property on the scheduled date<br>
                • Keep this email for your records<br>
                • Your invoice is attached to this email
              </p>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
              <p>Need help? Contact us at support@hosthaven.in</p>
              <p>&copy; {{year}} HostHaven. All rights reserved.</p>
            </div>
          </div>
        `,
        text: `
          Booking Confirmed!
          
          Hello {{name}},
          
          Your booking has been confirmed.
          
          Property: {{propertyName}}
          Check-in: {{checkIn}}
          Check-out: {{checkOut}}
          Booking ID: {{bookingId}}
          {{#if vendorName}}
          Host Details:
          Name: {{vendorName}}
          Location: {{vendorLocation || "N/A"}}
          {{#if vendorPhone}}Phone: {{vendorPhone}}{{/if}}
          {{#if vendorEmail}}Email: {{vendorEmail}}{{/if}}
          {{/if}}
          Total Amount: ₹{{totalAmount}}
          {{#if taxAmount}}
          Tax Details:
          CGST ({{taxPercent/2}}%): ₹{{cgstAmount?.toFixed(2) || 0}}
          SGST ({{taxPercent/2}}%): ₹{{sgstAmount?.toFixed(2) || 0}}
          Total Tax: ₹{{taxAmount.toFixed(2)}}
          {{/if}}
          
          Your invoice is attached to this email.
        `,
      },
      {
        name: 'service-booking-confirmed',
        subject: 'Service Booking Confirmed - HostHaven',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #d4a574; margin: 0;">HostHaven</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Service Booking Confirmation</p>
            </div>
            
            <p>Hello <strong>{{name}}</strong>,</p>
            <p>Thank you for booking with HostHaven! Your service booking has been confirmed.</p>
            
            <div style="background: #f9f9f9; border-radius: 10px; padding: 20px; margin: 25px 0; border: 1px solid #e0e0e0;">
              <h3 style="color: #d4a574; margin-top: 0; border-bottom: 2px solid #d4a574; padding-bottom: 10px;">Booking Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; width: 140px;"><strong>Booking ID:</strong></td>
                  <td style="padding: 8px 0; color: #333;">{{bookingId}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Service Name:</strong></td>
                  <td style="padding: 8px 0; color: #333;>{{serviceName}}</td>
                </tr>
                {{#if serviceCategory}}
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Category:</strong></td>
                  <td style="padding: 8px 0; color: #333;>{{serviceCategory}}</td>
                </tr>
                {{/if}}
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Service Date:</strong></td>
                  <td style="padding: 8px 0; color: #333;>{{serviceDate}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Service Time:</strong></td>
                  <td style="padding: 8px 0; color: #333;>{{serviceTime}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Location:</strong></td>
                  <td style="padding: 8px 0; color: #333;>{{location}}</td>
                </tr>
                {{#if notes}}
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Special Requests:</strong></td>
                  <td style="padding: 8px 0; color: #333;>{{notes}}</td>
                </tr>
                {{/if}}
              </table>
            </div>
            
            <div style="background: #fff8f0; border-radius: 10px; padding: 20px; margin: 25px 0; border-left: 4px solid #d4a574;">
              <h3 style="color: #d4a574; margin-top: 0;">Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Advance Paid:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 18px; font-weight: bold; color: #d4a574;>₹{{advanceAmount}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Total Amount:</strong></td>
                  <td style="padding: 8px 0; color: #333; font-size: 18px; font-weight: bold; color: #d4a574;>₹{{totalAmount}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Remaining Amount:</strong></td>
                  <td style="padding: 8px 0; color: #333;>₹{{remainingAmount}}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Payment Status:</strong></td>
                  <td style="padding: 8px 0;><span style="background: #4caf50; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;>{{paymentStatus}}</span></td>
                </tr>
              </table>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="color: #666; font-size: 14px; margin: 0;">
                <strong>What's Next?</strong><br>
                • Your booking is confirmed and the service provider has been notified<br>
                • Please arrive at the scheduled time and location<br>
                • Keep this email for your records<br>
                • Your invoice is attached to this email
              </p>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
              <p>Need help? Contact us at support@hosthaven.in</p>
              <p>&copy; {{year}} HostHaven. All rights reserved.</p>
            </div>
          </div>
        `,
        text: `
          Service Booking Confirmed - HostHaven
          
          Hello {{name}},
          
          Thank you for booking with HostHaven! Your service booking has been confirmed.
          
          BOOKING DETAILS:
          Booking ID: {{bookingId}}
          Service Name: {{serviceName}}
          {{#if serviceCategory}}Category: {{serviceCategory}}{{/if}}
          Service Date: {{serviceDate}}
          Service Time: {{serviceTime}}
          Location: {{location}}
          {{#if notes}}Special Requests: {{notes}}{{/if}}
          
          PAYMENT DETAILS:
          Advance Paid: ₹{{advanceAmount}}
          Total Amount: ₹{{totalAmount}}
          Remaining Amount: ₹{{remainingAmount}}
          Payment Status: {{paymentStatus}}
          
          What's Next?
          - Your booking is confirmed and the service provider has been notified
          - Please arrive at the scheduled time and location
          - Keep this email for your records
          - Your invoice is attached to this email
          
          Need help? Contact us at support@hosthaven.in
          
          © {{year}} HostHaven. All rights reserved.
        `,
      }
    ];

    // Upsert each template
    for (const templateData of templates) {
      try {
        const existingTemplate = await prisma.emailTemplate.findUnique({
          where: { name: templateData.name },
        });

        if (existingTemplate) {
          // Update existing template
          await prisma.emailTemplate.update({
            where: { id: existingTemplate.id },
            data: {
              subject: templateData.subject,
              html: templateData.html,
              text: templateData.text,
              updatedAt: new Date(),
            },
          });
          logger.info({ name: templateData.name }, 'Email template updated');
        } else {
          // Create new template
          await prisma.emailTemplate.create({
            data: {
              name: templateData.name,
              subject: templateData.subject,
              html: templateData.html,
              text: templateData.text,
            },
          });
          logger.info({ name: templateData.name }, 'Email template created');
        }
      } catch (error) {
        logger.error({ error, name: templateData.name }, `Failed to process email template ${templateData.name}`);
      }
    }

    logger.info({ action: 'seeding_email_templates' }, 'Email templates seeding completed');
  } catch (error) {
    logger.error({ error }, 'Failed to seed email templates');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();