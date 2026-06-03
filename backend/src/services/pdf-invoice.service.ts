import PDFDocument from "pdfkit";
import { logger } from "../utils/logger.util";

// ================= TYPES =================
interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  bookingDetails: {
    bookingNumber: string;
    checkIn: Date | string;
    checkOut: Date | string;
    nights: number;
  };
  property: {
    name: string;
    address: string;
  };
  room: {
    name: string;
    type: string;
  };
  guest: {
    name: string;
    email: string;
    phone: string;
  };
  pricing: {
    baseAmount: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
  };
  payment: {
    status: string;
    method: string;
    amount: number;
  };
  vendor: {
    name: string;
    email: string;
    phone: string;
  };
}

interface ServiceInvoiceData {
  invoiceNumber: string;
  bookingNumber: string;
  date: Date | string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  service: {
    name: string;
    category: string;
    date: Date | string;
    time: string;
    location: string;
  };
  pricing: {
    advancePaid: number;
    totalAmount: number;
    remainingAmount: number;
  };
  status: string;
}

// ================= HELPERS =================
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

// ================= MAIN INVOICE =================
export const generateInvoicePDF = async (
  data: InvoiceData
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: "A4", margin: 40 });

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const margin = 40;
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const contentWidth = pageWidth - margin * 2;
      const primary = "#1a365d";
      const gray = "#6b7280";
      const text = "#111827";

      let y = margin;

      const drawKeyValue = (
        label: string,
        value: string,
        x: number,
        rowY: number,
        width: number,
        labelWidth = 72,
      ) => {
        doc.font("Helvetica").fontSize(10).fillColor(gray).text(label, x, rowY, {
          width: labelWidth,
          lineBreak: false,
        });

        const valueX = x + labelWidth + 6;
        const valueWidth = Math.max(60, width - labelWidth - 6);
        const valueText = value || "-";

        const valueHeight = doc
          .font("Helvetica")
          .fontSize(10)
          .heightOfString(valueText, { width: valueWidth });

        doc.font("Helvetica").fontSize(10).fillColor(text).text(valueText, valueX, rowY, {
          width: valueWidth,
        });

        return rowY + Math.max(16, valueHeight + 2);
      };

      // Header
      doc.font("Helvetica-Bold").fontSize(22).fillColor(primary).text("HostHaven", margin, y);
      doc.font("Helvetica-Bold").fontSize(16).fillColor(primary).text("TAX INVOICE", margin, y, {
        width: contentWidth,
        align: "right",
      });

      y += 30;
      doc.font("Helvetica").fontSize(10).fillColor(gray).text(`Invoice: ${data.invoiceNumber}`, margin, y, {
        width: contentWidth,
        align: "right",
      });
      y += 14;
      doc.text(`Booking: ${data.bookingDetails.bookingNumber}`, margin, y, {
        width: contentWidth,
        align: "right",
      });
      y += 14;
      doc.text(`Date: ${formatDate(data.invoiceDate)}`, margin, y, {
        width: contentWidth,
        align: "right",
      });

      y += 20;
      doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke("#e5e7eb");
      y += 16;

      // Guest + Vendor blocks
      const columnGap = 24;
      const colWidth = (contentWidth - columnGap) / 2;
      const leftX = margin;
      const rightX = margin + colWidth + columnGap;

      doc.font("Helvetica-Bold").fontSize(11).fillColor(primary).text("GUEST", leftX, y);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(primary).text("VENDOR", rightX, y);

      let leftY = y + 16;
      let rightY = y + 16;

      leftY = drawKeyValue("Name", data.guest.name, leftX, leftY, colWidth);
      leftY = drawKeyValue("Phone", data.guest.phone || "N/A", leftX, leftY, colWidth);
      leftY = drawKeyValue("Email", data.guest.email, leftX, leftY, colWidth);

      rightY = drawKeyValue("Name", data.vendor.name, rightX, rightY, colWidth);
      rightY = drawKeyValue("Phone", data.vendor.phone || "N/A", rightX, rightY, colWidth);
      rightY = drawKeyValue("Email", data.vendor.email, rightX, rightY, colWidth);

      y = Math.max(leftY, rightY) + 8;

      doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke("#e5e7eb");
      y += 16;

      // Booking details
      doc.font("Helvetica-Bold").fontSize(11).fillColor(primary).text("BOOKING DETAILS", margin, y);
      y += 16;

      y = drawKeyValue("Property", data.property.name, margin, y, contentWidth);
      y = drawKeyValue("Room", `${data.room.name} (${data.room.type})`, margin, y, contentWidth);
      y = drawKeyValue("Check-in", formatDate(data.bookingDetails.checkIn), margin, y, contentWidth);
      y = drawKeyValue("Check-out", formatDate(data.bookingDetails.checkOut), margin, y, contentWidth);
      y = drawKeyValue("Nights", `${data.bookingDetails.nights}`, margin, y, contentWidth);

      y += 10;

      // Pricing table header
      doc.rect(margin, y, contentWidth, 24).fill(primary);
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#ffffff").text("Description", margin + 10, y + 7);
      doc.text("Amount", margin, y + 7, {
        width: contentWidth - 10,
        align: "right",
      });

      y += 24;

      const rows: Array<[string, number]> = [
        ["Room Charges", data.pricing.baseAmount],
        ["Tax", data.pricing.taxAmount],
      ];
      if (data.pricing.discountAmount > 0) {
        rows.push(["Discount", -data.pricing.discountAmount]);
      }

      rows.forEach(([label, amount], index) => {
        const rowHeight = 22;
        if (index % 2 === 0) {
          doc.rect(margin, y, contentWidth, rowHeight).fill("#f9fafb");
        }
        doc.font("Helvetica").fontSize(10).fillColor(text).text(label, margin + 10, y + 6);
        doc.text(formatCurrency(amount), margin, y + 6, {
          width: contentWidth - 10,
          align: "right",
        });
        y += rowHeight;
      });

      // Total row
      doc.rect(margin, y, contentWidth, 28).fill(primary);
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#ffffff").text("TOTAL", margin + 10, y + 9);
      doc.text(formatCurrency(data.pricing.totalAmount), margin, y + 9, {
        width: contentWidth - 10,
        align: "right",
      });

      y += 40;

      // Payment block
      doc.font("Helvetica-Bold").fontSize(11).fillColor(primary).text("PAYMENT", margin, y);
      y += 16;
      y = drawKeyValue("Method", data.payment.method, margin, y, contentWidth);
      y = drawKeyValue("Paid", formatCurrency(data.payment.amount), margin, y, contentWidth);

      const normalizedStatus = (data.payment.status || "").toUpperCase();
      const statusColor =
        normalizedStatus === "PAID" || normalizedStatus === "COMPLETED"
          ? "#16a34a"
          : normalizedStatus === "FAILED"
            ? "#dc2626"
            : "#f59e0b";

      doc.rect(margin, y + 4, 110, 22).fill(statusColor);
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#ffffff").text(normalizedStatus || "PENDING", margin, y + 11, {
        width: 110,
        align: "center",
      });

      // Footer
      doc.font("Helvetica").fontSize(9).fillColor(gray).text(
        "Thank you for choosing HostHaven",
        margin,
        pageHeight - 50,
        { width: contentWidth, align: "center" },
      );

      doc.end();
    } catch (err) {
      logger.error(err);
      reject(err);
    }
  });
};

// ================= SERVICE INVOICE =================
export const generateServiceBookingInvoicePDF = async (
  data: ServiceInvoiceData
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: "A4", margin: 40 });

      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      let y = 40;
      const primary = "#b45309";
      const gray = "#374151";

      // HEADER
      doc.font("Helvetica-Bold").fontSize(22).fillColor(primary)
        .text("HostHaven", 40, y);

      y += 25;

      doc.fontSize(12).fillColor(gray)
        .text("Service Booking Invoice", 40, y);

      y += 20;

      // META
      doc.text(`Invoice: ${data.invoiceNumber}`, 40, y);
      doc.text(`Booking: ${data.bookingNumber}`, 40, y + 15);
      doc.text(`Date: ${formatDate(data.date)}`, 40, y + 30);
      doc.text(`Status: ${data.status}`, 40, y + 45);

      y += 80;

      // CUSTOMER
      doc.font("Helvetica-Bold").fillColor(primary)
        .text("Customer", 40, y);

      y += 15;

      doc.font("Helvetica").fillColor(gray)
        .text(data.customer.name, 40, y)
        .text(data.customer.email, 40, y + 15)
        .text(data.customer.phone, 40, y + 30);

      y += 60;

      // SERVICE
      doc.font("Helvetica-Bold").fillColor(primary)
        .text("Service", 40, y);

      y += 15;

      doc.font("Helvetica").fillColor(gray)
        .text(data.service.name, 40, y)
        .text(data.service.category, 40, y + 15)
        .text(`${formatDate(data.service.date)} ${data.service.time}`, 40, y + 30)
        .text(data.service.location, 40, y + 45);

      y += 80;

      // PAYMENT
      doc.font("Helvetica-Bold").fillColor(primary)
        .text("Payment Summary", 40, y);

      y += 15;

      doc.font("Helvetica").fillColor(gray)
        .text(`Advance: ${formatCurrency(data.pricing.advancePaid)}`, 40, y)
        .text(`Total: ${formatCurrency(data.pricing.totalAmount)}`, 40, y + 15)
        .text(`Remaining: ${formatCurrency(data.pricing.remainingAmount)}`, 40, y + 30);

      doc.end();
    } catch (err) {
      logger.error(err);
      reject(err);
    }
  });
};