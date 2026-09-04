/**
 * PDF Generation Service for CandyCapture Photography Invoice Application
 *
 * @description Generates professional A4 invoice PDFs matching the reference design
 * using jsPDF. Supports logo rendering, Indian currency formatting, and exact layout
 * matching the CandyCapture brand guidelines.
 *
 * @requirements 9.1 A4 portrait format with 15mm margins
 * @requirements 9.2 Embed logo from settings
 * @requirements 9.3 Print-ready resolution (300 DPI equivalent)
 * @requirements 9.4 Pink/magenta color scheme (#E91E63)
 * @requirements 9.9 Generation within 3 seconds
 * @requirements 9.10 File size under 5MB
 * @requirements 9.12 Graceful logo fallback
 * @requirements 1.1-1.19 Invoice design compliance
 * @requirements 2.1-2.6 Service table structure (S.NO, SERVICE, QTY only)
 */

import jsPDF from 'jspdf';
import type { Invoice, Customer, Settings } from '../types/models';
import { formatIndianCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';

// ============================================
// PDF Layout Configuration (Task 13.1)
// ============================================

/**
 * PDF page dimensions and layout configuration
 * A4 portrait: 210mm × 297mm with 15mm margins
 */
const PDF_CONFIG = {
  // Page dimensions (A4 portrait)
  pageWidth: 210,
  pageHeight: 297,
  margin: 15,

  // Colors (Requirements 1.3, 1.15)
  colors: {
    primary: '#E91E63', // Pink/magenta - brand color
    primaryRgb: [233, 30, 99] as [number, number, number],
    text: '#2D1A26', // Dark text
    textRgb: [45, 26, 38] as [number, number, number],
    lightText: '#666666', // Secondary text
    lightTextRgb: [102, 102, 102] as [number, number, number],
    white: '#FFFFFF',
    whiteRgb: [255, 255, 255] as [number, number, number],
    tableHeaderBg: '#FDE4EC', // Light pink for table header
    tableHeaderBgRgb: [253, 228, 236] as [number, number, number],
    tableRowAlt: '#FFF8FA', // Very light pink for alternating rows
    tableRowAltRgb: [255, 248, 250] as [number, number, number],
    border: '#F8BBD9', // Pink border
    borderRgb: [248, 187, 217] as [number, number, number],
    // Payment status colors (Requirement 1.15)
    statusPending: '#FF9800', // Orange/amber for PENDING
    statusPendingRgb: [255, 152, 0] as [number, number, number],
    statusPartial: '#FFC107', // Yellow for PARTIALLY_PAID
    statusPartialRgb: [255, 193, 7] as [number, number, number],
    statusPaid: '#4CAF50', // Green for PAID
    statusPaidRgb: [76, 175, 80] as [number, number, number],
  },

  // Typography settings
  fonts: {
    title: 24,
    heading: 12,
    normal: 10,
    small: 9,
    tiny: 8,
  },

  // Content area
  get contentWidth() {
    return this.pageWidth - this.margin * 2;
  },
  get contentHeight() {
    return this.pageHeight - this.margin * 2;
  },
} as const;

// ============================================
// Helper Types (reserved for future use)
// ============================================

// Position and dimension types are defined inline for simplicity

// ============================================
// PDF Generator Class
// ============================================

class InvoicePdfGenerator {
  private doc: jsPDF;
  private y: number = PDF_CONFIG.margin;
  private logoDataUrl: string | null = null;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }

  // ============================================
  // Task 13.1: Layout Engine Helper Functions
  // ============================================

  /**
   * Set the current Y position
   */
  private setY(y: number): void {
    this.y = y;
  }

  /**
   * Move Y position by offset
   */
  private moveY(offset: number): void {
    this.y += offset;
  }

  /**
   * Get left margin X position
   */
  private getLeftX(): number {
    return PDF_CONFIG.margin;
  }

  /**
   * Get right edge X position
   */
  private getRightX(): number {
    return PDF_CONFIG.pageWidth - PDF_CONFIG.margin;
  }

  /**
   * Get center X position
   */
  private getCenterX(): number {
    return PDF_CONFIG.pageWidth / 2;
  }

  /**
   * Set text color using RGB values
   */
  private setTextColor(rgb: [number, number, number]): void {
    this.doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  }

  /**
   * Set fill color using RGB values
   */
  private setFillColor(rgb: [number, number, number]): void {
    this.doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  }

  /**
   * Set draw color using RGB values
   */
  private setDrawColor(rgb: [number, number, number]): void {
    this.doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  }

  /**
   * Draw text at position
   */
  private drawText(
    text: string,
    x: number,
    y: number,
    options?: {
      align?: 'left' | 'center' | 'right';
      maxWidth?: number;
      fontSize?: number;
      fontStyle?: 'normal' | 'bold' | 'italic';
      color?: [number, number, number];
    }
  ): void {
    if (options?.fontSize) {
      this.doc.setFontSize(options.fontSize);
    }
    if (options?.fontStyle) {
      this.doc.setFont('helvetica', options.fontStyle);
    }
    if (options?.color) {
      this.setTextColor(options.color);
    }

    const textOptions: { align?: 'left' | 'center' | 'right'; maxWidth?: number } = {};
    if (options?.align) {
      textOptions.align = options.align;
    }
    if (options?.maxWidth) {
      textOptions.maxWidth = options.maxWidth;
    }

    this.doc.text(text, x, y, textOptions);
  }

  /**
   * Draw a filled rectangle
   */
  private drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options?: {
      fill?: [number, number, number];
      stroke?: [number, number, number];
      lineWidth?: number;
      radius?: number;
    }
  ): void {
    if (options?.lineWidth) {
      this.doc.setLineWidth(options.lineWidth);
    }

    if (options?.fill) {
      this.setFillColor(options.fill);
    }
    if (options?.stroke) {
      this.setDrawColor(options.stroke);
    }

    const drawStyle = options?.fill && options?.stroke ? 'FD' : options?.fill ? 'F' : 'S';

    if (options?.radius) {
      // Rounded rectangle (jsPDF >= 2.3.0)
      this.doc.roundedRect(x, y, width, height, options.radius, options.radius, drawStyle);
    } else {
      this.doc.rect(x, y, width, height, drawStyle);
    }
  }

  /**
   * Draw a horizontal line
   */
  private drawLine(x1: number, y1: number, x2: number, y2: number, color?: [number, number, number], lineWidth?: number): void {
    if (color) {
      this.setDrawColor(color);
    }
    if (lineWidth) {
      this.doc.setLineWidth(lineWidth);
    }
    this.doc.line(x1, y1, x2, y2);
  }

  /**
   * Draw an icon symbol (using text symbols as fallback)
   */
  private drawIcon(icon: string, x: number, y: number, size: number = 10): void {
    this.doc.setFontSize(size);
    this.setTextColor(PDF_CONFIG.colors.primaryRgb);
    this.doc.text(icon, x, y);
  }

  // ============================================
  // Task 13.2: Header Section
  // ============================================

  /**
   * Render PDF header with logo and invoice title
   * Requirements: 1.1, 1.2, 1.5, 1.6, 1.19
   */
  private async renderHeader(settings: Settings, invoice: Invoice): Promise<void> {
    const startY = PDF_CONFIG.margin;
    this.setY(startY);

    // Left side: Logo or fallback text
    await this.renderLogo(settings);

    // Right side: INVOICE title
    this.renderInvoiceTitle();

    // Invoice metadata box below title
    this.renderInvoiceMetadataBox(invoice);

    // Move Y position past the header section
    this.setY(startY + 55);
  }

  /**
   * Render logo or fallback text
   * Requirements: 1.1, 1.2, 1.19
   */
  private async renderLogo(settings: Settings): Promise<void> {
    const logoX = this.getLeftX();
    const logoY = this.y;
    const logoMaxWidth = 50;
    const logoMaxHeight = 35;

    if (this.logoDataUrl) {
      try {
        // Add the logo image
        this.doc.addImage(this.logoDataUrl, 'PNG', logoX, logoY, logoMaxWidth, logoMaxHeight);
      } catch {
        // Fallback to text if image fails
        this.renderLogoFallback(settings, logoX, logoY);
      }
    } else {
      // No logo available, render fallback text
      this.renderLogoFallback(settings, logoX, logoY);
    }

    // Tagline below logo (Requirement 1.19)
    this.drawText('P  H  O  T  O  G  R  A  P  H  Y', logoX, logoY + 38, {
      fontSize: 7,
      color: PDF_CONFIG.colors.textRgb,
      fontStyle: 'normal',
    });

    // "We Capture Your Sweetest Moments" tagline with heart
    this.setTextColor(PDF_CONFIG.colors.primaryRgb);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'italic');
    this.doc.text('We Capture Your Sweetest Moments', logoX, logoY + 43);

    // Heart symbol
    this.setTextColor([233, 30, 99]); // Pink heart
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('♥', logoX + 53, logoY + 43);
  }

  /**
   * Render text fallback when logo is not available
   */
  private renderLogoFallback(_settings: Settings, x: number, y: number): void {
    // CandyCapture text in stylized format
    this.setTextColor(PDF_CONFIG.colors.primaryRgb);
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('CandyCapture', x, y + 15);

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'italic');
    this.doc.text('Photography', x + 2, y + 22);
  }

  /**
   * Render INVOICE title at top-right
   * Requirement: 1.5
   */
  private renderInvoiceTitle(): void {
    const rightX = this.getRightX();
    const titleY = this.y + 8;

    this.drawText('INVOICE', rightX, titleY, {
      align: 'right',
      fontSize: PDF_CONFIG.fonts.title,
      fontStyle: 'bold',
      color: PDF_CONFIG.colors.primaryRgb,
    });
  }

  /**
   * Render invoice metadata box with pink border
   * Requirement: 1.6
   */
  private renderInvoiceMetadataBox(invoice: Invoice): void {
    const boxWidth = 65;
    const boxHeight = 32;
    const boxX = this.getRightX() - boxWidth;
    const boxY = this.y + 15;

    // Draw box with pink border
    this.drawRect(boxX, boxY, boxWidth, boxHeight, {
      stroke: PDF_CONFIG.colors.borderRgb,
      lineWidth: 0.5,
      radius: 2,
    });

    // Invoice metadata rows
    const labelX = boxX + 3;
    const valueX = boxX + boxWidth - 3;
    let rowY = boxY + 8;
    const rowHeight = 8;

    // Row style
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');

    // Invoice No
    this.drawIcon('📋', labelX - 1, rowY - 0.5, 8);
    this.setTextColor(PDF_CONFIG.colors.lightTextRgb);
    this.doc.text('Invoice No', labelX + 5, rowY);
    this.doc.text(':', labelX + 27, rowY);
    this.setTextColor(PDF_CONFIG.colors.textRgb);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(invoice.invoiceNumber, valueX, rowY, { align: 'right' });

    rowY += rowHeight;

    // Invoice Date
    this.doc.setFont('helvetica', 'normal');
    this.drawIcon('📅', labelX - 1, rowY - 0.5, 8);
    this.setTextColor(PDF_CONFIG.colors.lightTextRgb);
    this.doc.text('Invoice Date', labelX + 5, rowY);
    this.doc.text(':', labelX + 27, rowY);
    this.setTextColor(PDF_CONFIG.colors.textRgb);
    this.doc.text(formatDate(invoice.invoiceDate), valueX, rowY, { align: 'right' });

    rowY += rowHeight;

    // Due Date
    this.drawIcon('📆', labelX - 1, rowY - 0.5, 8);
    this.setTextColor(PDF_CONFIG.colors.lightTextRgb);
    this.doc.text('Due Date', labelX + 5, rowY);
    this.doc.text(':', labelX + 27, rowY);
    this.setTextColor(PDF_CONFIG.colors.textRgb);
    this.doc.text(formatDate(invoice.dueDate), valueX, rowY, { align: 'right' });
  }

  // ============================================
  // Task 13.3: Bill To / From Sections
  // ============================================

  /**
   * Render Bill To and From sections
   * Requirements: 1.7, 1.8, 1.19
   */
  private renderBillToFrom(customer: Customer, settings: Settings): void {
    const sectionY = this.y;
    const leftColumnX = this.getLeftX();
    const rightColumnX = this.getCenterX() + 5;
    const columnWidth = (PDF_CONFIG.contentWidth - 10) / 2;

    // BILL TO section (left)
    this.renderBillToSection(customer, leftColumnX, sectionY, columnWidth);

    // FROM section (right)
    this.renderFromSection(settings, rightColumnX, sectionY, columnWidth);

    // Move Y past this section
    this.moveY(55);
  }

  /**
   * Render BILL TO section with customer details
   * Requirement: 1.7
   */
  private renderBillToSection(customer: Customer, x: number, y: number, width: number): void {
    // Section header with icon
    this.drawIcon('👤', x, y + 4, 10);
    this.drawText('BILL TO', x + 7, y + 4, {
      fontSize: 11,
      fontStyle: 'bold',
      color: PDF_CONFIG.colors.primaryRgb,
    });

    // Customer details
    const detailsY = y + 12;
    const labelWidth = 25;
    const valueX = x + labelWidth + 5;
    let rowY = detailsY;
    const rowHeight = 6;

    this.doc.setFontSize(9);

    // Name
    this.setTextColor(PDF_CONFIG.colors.lightTextRgb);
    this.doc.text('Name', x, rowY);
    this.doc.text(':', x + labelWidth, rowY);
    this.setTextColor(PDF_CONFIG.colors.textRgb);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(customer.name, valueX, rowY);
    rowY += rowHeight;

    // Mobile
    this.doc.setFont('helvetica', 'normal');
    this.setTextColor(PDF_CONFIG.colors.lightTextRgb);
    this.doc.text('Mobile', x, rowY);
    this.doc.text(':', x + labelWidth, rowY);
    this.setTextColor(PDF_CONFIG.colors.textRgb);
    this.doc.text(customer.mobile, valueX, rowY);
    rowY += rowHeight;

    // Event
    this.setTextColor(PDF_CONFIG.colors.lightTextRgb);
    this.doc.text('Event', x, rowY);
    this.doc.text(':', x + labelWidth, rowY);
    this.setTextColor(PDF_CONFIG.colors.textRgb);
    this.doc.text(customer.eventType, valueX, rowY);
    rowY += rowHeight;

    // Event Date
    this.setTextColor(PDF_CONFIG.colors.lightTextRgb);
    this.doc.text('Event Date', x, rowY);
    this.doc.text(':', x + labelWidth, rowY);
    this.setTextColor(PDF_CONFIG.colors.textRgb);
    this.doc.text(formatDate(customer.eventDate), valueX, rowY);
    rowY += rowHeight;

    // Location
    this.setTextColor(PDF_CONFIG.colors.lightTextRgb);
    this.doc.text('Location', x, rowY);
    this.doc.text(':', x + labelWidth, rowY);
    this.setTextColor(PDF_CONFIG.colors.textRgb);
    // Truncate location if too long
    const maxLocationWidth = width - labelWidth - 10;
    const locationText = this.truncateText(customer.location, maxLocationWidth, 9);
    this.doc.text(locationText, valueX, rowY);
  }

  /**
   * Render FROM section with studio information
   * Requirement: 1.8
   */
  private renderFromSection(settings: Settings, x: number, y: number, width: number): void {
    // Section header with icon
    this.drawIcon('📍', x, y + 4, 10);
    this.drawText('FROM', x + 7, y + 4, {
      fontSize: 11,
      fontStyle: 'bold',
      color: PDF_CONFIG.colors.primaryRgb,
    });

    // Studio name
    const detailsY = y + 12;
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.setTextColor(PDF_CONFIG.colors.textRgb);
    this.doc.text(settings.businessName, x, detailsY);

    let rowY = detailsY + 7;
    const iconOffset = 6;

    // Address with location icon
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.drawIcon('📍', x - 1, rowY, 8);
    this.setTextColor(PDF_CONFIG.colors.textRgb);
    const addressLines = this.wrapText(settings.address, width - iconOffset, 8);
    addressLines.forEach((line, index) => {
      this.doc.text(line, x + iconOffset, rowY + index * 4);
    });
    rowY += addressLines.length * 4 + 3;

    // Phone with icon
    this.drawIcon('📞', x - 1, rowY, 8);
    this.doc.text(this.formatPhoneNumber(settings.phone), x + iconOffset, rowY);
    rowY += 5;

    // Email with icon
    this.drawIcon('✉', x - 1, rowY, 8);
    this.doc.text(settings.email, x + iconOffset, rowY);
    rowY += 5;

    // Instagram with icon
    this.drawIcon('📷', x - 1, rowY, 8);
    this.doc.text(`@${settings.instagramHandle}`, x + iconOffset, rowY);
  }

  // ============================================
  // Task 13.4: Services Table
  // ============================================

  /**
   * Render services table with exactly 3 columns: S.NO, SERVICE, QTY
   * Requirements: 1.9, 1.10, 2.1, 2.2, 2.6
   */
  private renderServicesTable(services: Invoice['services']): void {
    const tableX = this.getLeftX();
    const tableWidth = PDF_CONFIG.contentWidth;
    const headerHeight = 8;
    const rowHeight = 7;

    // Section header
    this.drawIcon('📋', tableX, this.y + 4, 10);
    this.drawText('SERVICES BOOKED', tableX + 7, this.y + 4, {
      fontSize: 11,
      fontStyle: 'bold',
      color: PDF_CONFIG.colors.primaryRgb,
    });
    this.moveY(10);

    // Column widths (exactly 3 columns - NO pricing columns)
    const col1Width = 15; // S.NO
    const col3Width = 20; // QTY
    const col2Width = tableWidth - col1Width - col3Width; // SERVICE

    const col1X = tableX;
    const col2X = tableX + col1Width;
    const col3X = tableX + col1Width + col2Width;

    // Table header with pink background
    this.drawRect(tableX, this.y, tableWidth, headerHeight, {
      fill: PDF_CONFIG.colors.tableHeaderBgRgb,
    });

    // Header text
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.setTextColor(PDF_CONFIG.colors.textRgb);

    const headerY = this.y + 5.5;
    this.doc.text('S.NO', col1X + col1Width / 2, headerY, { align: 'center' });
    this.doc.text('SERVICE', col2X + 5, headerY);
    this.doc.text('QTY', col3X + col3Width / 2, headerY, { align: 'center' });

    this.moveY(headerHeight);

    // Table rows
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);

    services.forEach((service, index) => {
      const rowY = this.y;
      const isAltRow = index % 2 === 1;

      // Alternating row background
      if (isAltRow) {
        this.drawRect(tableX, rowY, tableWidth, rowHeight, {
          fill: PDF_CONFIG.colors.tableRowAltRgb,
        });
      }

      // Row border
      this.drawLine(tableX, rowY + rowHeight, tableX + tableWidth, rowY + rowHeight, PDF_CONFIG.colors.borderRgb, 0.2);

      // Row content
      const textY = rowY + 5;
      this.setTextColor(PDF_CONFIG.colors.textRgb);

      // S.NO (centered)
      this.doc.text(String(index + 1), col1X + col1Width / 2, textY, { align: 'center' });

      // SERVICE (left aligned with truncation)
      const maxServiceWidth = col2Width - 10;
      const serviceName = this.truncateText(service.name, maxServiceWidth, 9);
      this.doc.text(serviceName, col2X + 5, textY);

      // QTY (centered)
      this.doc.text(String(service.quantity), col3X + col3Width / 2, textY, { align: 'center' });

      this.moveY(rowHeight);
    });

    // Bottom border of table
    this.drawLine(tableX, this.y, tableX + tableWidth, this.y, PDF_CONFIG.colors.borderRgb, 0.3);

    this.moveY(8);
  }

  // ============================================
  // Task 13.6: Notes and Payment Summary
  // ============================================

  /**
   * Render notes section and payment summary
   * Requirements: 1.11, 1.12, 1.13, 1.14, 1.15
   */
  private renderNotesAndSummary(invoice: Invoice, settings: Settings): void {
    const leftX = this.getLeftX();
    const rightX = this.getCenterX() + 10;
    const leftWidth = this.getCenterX() - leftX - 5;
    const rightWidth = this.getRightX() - rightX;
    const sectionY = this.y;

    // Left: Notes section
    this.renderNotesSection(invoice, settings, leftX, sectionY, leftWidth);

    // Right: Payment summary
    this.renderPaymentSummary(invoice, rightX, sectionY, rightWidth);

    // Move Y past this section
    this.setY(sectionY + 70);
  }

  /**
   * Render notes section
   * Requirements: 1.11, 1.12
   */
  private renderNotesSection(
    invoice: Invoice,
    settings: Settings,
    x: number,
    y: number,
    width: number
  ): void {
    // Section header
    this.drawIcon('📝', x, y + 4, 10);
    this.drawText('NOTES', x + 7, y + 4, {
      fontSize: 11,
      fontStyle: 'bold',
      color: PDF_CONFIG.colors.primaryRgb,
    });

    // Notes content
    const notesText = invoice.notes || settings.defaultNotes || '';
    const notesLines = notesText.split('\n').flatMap((line) => {
      // Handle bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
        return this.wrapText(line.trim(), width - 5, 8).map((l, i) => (i === 0 ? l : `  ${l}`));
      }
      return this.wrapText(line.trim(), width - 5, 8);
    });

    let noteY = y + 12;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.setTextColor(PDF_CONFIG.colors.textRgb);

    notesLines.slice(0, 8).forEach((line) => {
      // Add bullet point if not already present
      const displayLine = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*') || line.startsWith('  ')
        ? line
        : `• ${line}`;
      this.doc.text(displayLine, x, noteY);
      noteY += 4;
    });

    // Thank You message with heart (Requirement 1.12)
    const thankYouY = y + 50;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'italic');
    this.setTextColor(PDF_CONFIG.colors.primaryRgb);
    this.doc.text('Thank You!', x, thankYouY);

    // Heart symbol
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('♥', x + 30, thankYouY);

    // Sub-text
    this.doc.setFontSize(8);
    this.setTextColor(PDF_CONFIG.colors.lightTextRgb);
    this.doc.text('for choosing CandyCapture Photography.', x, thankYouY + 5);
  }

  /**
   * Render payment summary box
   * Requirements: 1.13, 1.14, 1.15
   */
  private renderPaymentSummary(invoice: Invoice, x: number, y: number, width: number): void {
    const rowHeight = 12;
    let rowY = y;

    this.doc.setFontSize(10);

    // TOTAL AMOUNT row
    this.drawRect(x, rowY, width, rowHeight, {
      stroke: PDF_CONFIG.colors.borderRgb,
      lineWidth: 0.3,
    });
    this.doc.setFont('helvetica', 'bold');
    this.setTextColor(PDF_CONFIG.colors.textRgb);
    this.doc.text('TOTAL AMOUNT', x + 5, rowY + 8);
    this.doc.text(formatIndianCurrency(invoice.totalAmount), x + width - 5, rowY + 8, { align: 'right' });
    rowY += rowHeight;

    // ADVANCE PAID row
    this.drawRect(x, rowY, width, rowHeight, {
      stroke: PDF_CONFIG.colors.borderRgb,
      lineWidth: 0.3,
    });
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('ADVANCE PAID', x + 5, rowY + 8);
    this.doc.text(formatIndianCurrency(invoice.advancePaid), x + width - 5, rowY + 8, { align: 'right' });
    rowY += rowHeight;

    // BALANCE DUE row with pink background (Requirement 1.13)
    this.drawRect(x, rowY, width, rowHeight, {
      fill: PDF_CONFIG.colors.primaryRgb,
      stroke: PDF_CONFIG.colors.primaryRgb,
      lineWidth: 0.3,
    });
    this.doc.setFont('helvetica', 'bold');
    this.setTextColor(PDF_CONFIG.colors.whiteRgb);
    this.doc.text('BALANCE DUE', x + 5, rowY + 8);
    this.doc.text(formatIndianCurrency(invoice.balanceDue), x + width - 5, rowY + 8, { align: 'right' });
    rowY += rowHeight + 5;

    // Payment Status badge (Requirement 1.15)
    this.renderPaymentStatusBadge(invoice.paymentStatus, x, rowY, width);
  }

  /**
   * Render payment status badge
   * Requirement: 1.15
   */
  private renderPaymentStatusBadge(
    status: Invoice['paymentStatus'],
    x: number,
    y: number,
    _containerWidth: number
  ): void {
    // Status label
    this.drawIcon('💳', x, y + 4, 9);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.setTextColor(PDF_CONFIG.colors.textRgb);
    this.doc.text('PAYMENT STATUS :', x + 7, y + 4);

    // Badge styling based on status
    let badgeColor: [number, number, number];
    let statusText: string;

    switch (status) {
      case 'PENDING':
        badgeColor = PDF_CONFIG.colors.statusPendingRgb;
        statusText = 'PENDING';
        break;
      case 'PARTIALLY_PAID':
        badgeColor = PDF_CONFIG.colors.statusPartialRgb;
        statusText = 'PARTIALLY PAID';
        break;
      case 'PAID':
        badgeColor = PDF_CONFIG.colors.statusPaidRgb;
        statusText = 'PAID';
        break;
      default:
        badgeColor = PDF_CONFIG.colors.statusPendingRgb;
        statusText = 'PENDING';
    }

    // Badge background
    const badgeX = x + 50;
    const badgeWidth = 35;
    const badgeHeight = 7;
    this.drawRect(badgeX, y - 1, badgeWidth, badgeHeight, {
      fill: badgeColor,
      radius: 2,
    });

    // Badge text
    this.setTextColor(PDF_CONFIG.colors.whiteRgb);
    this.doc.setFontSize(7);
    this.doc.text(statusText, badgeX + badgeWidth / 2, y + 4, { align: 'center' });
  }

  // ============================================
  // Task 13.7: Payment Details and Footer
  // ============================================

  /**
   * Render payment details and footer
   * Requirements: 1.16, 1.17, 1.18
   */
  private renderPaymentDetailsAndFooter(settings: Settings): void {
    // Payment details section
    this.renderPaymentDetails(settings);

    // Signature area
    this.renderSignatureArea(settings);

    // Footer bar
    this.renderFooter(settings);
  }

  /**
   * Render payment details section
   * Requirement: 1.16
   */
  private renderPaymentDetails(settings: Settings): void {
    const x = this.getLeftX();
    const labelWidth = 30;
    const valueX = x + labelWidth + 5;

    // Section header
    this.drawIcon('🏦', x, this.y + 4, 10);
    this.drawText('PAYMENT DETAILS', x + 7, this.y + 4, {
      fontSize: 11,
      fontStyle: 'bold',
      color: PDF_CONFIG.colors.primaryRgb,
    });
    this.moveY(12);

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');

    const details = [
      ['Account Name', settings.bankAccountName],
      ['Bank Name', settings.bankName],
      ['Account No', this.formatAccountNumber(settings.bankAccountNumber)],
      ['IFSC Code', settings.ifscCode],
      ['UPI ID', settings.upiId],
    ];

    details.forEach(([label, value]) => {
      this.setTextColor(PDF_CONFIG.colors.lightTextRgb);
      this.doc.text(label ?? '', x, this.y);
      this.doc.text(':', x + labelWidth, this.y);
      this.setTextColor(PDF_CONFIG.colors.textRgb);
      this.doc.text(value ?? '', valueX, this.y);
      this.moveY(5);
    });
  }

  /**
   * Render authorized signature area
   * Requirement: 1.17
   */
  private renderSignatureArea(settings: Settings): void {
    const signatureX = this.getCenterX() + 20;
    const signatureY = this.y - 15;
    const signatureWidth = 60;

    // Signature line
    this.drawLine(
      signatureX,
      signatureY + 15,
      signatureX + signatureWidth,
      signatureY + 15,
      PDF_CONFIG.colors.textRgb,
      0.3
    );

    // Signature text (stylized)
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'italic');
    this.setTextColor(PDF_CONFIG.colors.primaryRgb);
    this.doc.text('CandyCapture', signatureX + signatureWidth / 2, signatureY + 10, { align: 'center' });

    // Label
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.setTextColor(PDF_CONFIG.colors.lightTextRgb);
    this.doc.text('Authorized Signature', signatureX + signatureWidth / 2, signatureY + 20, { align: 'center' });
    this.doc.text(settings.businessName, signatureX + signatureWidth / 2, signatureY + 25, { align: 'center' });

    this.moveY(10);
  }

  /**
   * Render footer bar with contact information
   * Requirement: 1.18
   */
  private renderFooter(settings: Settings): void {
    const footerHeight = 10;
    const footerY = PDF_CONFIG.pageHeight - PDF_CONFIG.margin - footerHeight;

    // Footer background bar
    this.drawRect(this.getLeftX(), footerY, PDF_CONFIG.contentWidth, footerHeight, {
      fill: PDF_CONFIG.colors.primaryRgb,
    });

    // Contact info in footer
    const centerY = footerY + 6.5;
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.setTextColor(PDF_CONFIG.colors.whiteRgb);

    const phone = `📞 ${this.formatPhoneNumber(settings.phone)}`;
    const email = `✉ ${settings.email}`;
    const instagram = `📷 @${settings.instagramHandle}`;

    // Calculate positions for even spacing
    const sectionWidth = PDF_CONFIG.contentWidth / 3;
    const section1X = this.getLeftX() + sectionWidth / 2;
    const section2X = this.getLeftX() + sectionWidth + sectionWidth / 2;
    const section3X = this.getLeftX() + sectionWidth * 2 + sectionWidth / 2;

    this.doc.text(phone, section1X, centerY, { align: 'center' });

    // Divider
    this.doc.text('|', this.getLeftX() + sectionWidth, centerY, { align: 'center' });

    this.doc.text(email, section2X, centerY, { align: 'center' });

    // Divider
    this.doc.text('|', this.getLeftX() + sectionWidth * 2, centerY, { align: 'center' });

    this.doc.text(instagram, section3X, centerY, { align: 'center' });
  }

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Format phone number with spaces (95004 40272)
   */
  private formatPhoneNumber(phone: string): string {
    if (phone.length === 10) {
      return `${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
  }

  /**
   * Format account number with spaces for readability
   */
  private formatAccountNumber(accountNumber: string): string {
    return accountNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  /**
   * Wrap text to fit within a specified width
   */
  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    this.doc.setFontSize(fontSize);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = this.doc.getTextWidth(testLine);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Truncate text with ellipsis if it exceeds max width
   */
  private truncateText(text: string, maxWidth: number, fontSize: number): string {
    this.doc.setFontSize(fontSize);
    const textWidth = this.doc.getTextWidth(text);

    if (textWidth <= maxWidth) {
      return text;
    }

    let truncated = text;
    while (this.doc.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }

    return truncated + '...';
  }

  /**
   * Load logo image and convert to data URL
   */
  async loadLogo(logoUrl?: string): Promise<void> {
    if (!logoUrl) {
      this.logoDataUrl = null;
      return;
    }

    try {
      const response = await fetch(logoUrl);
      const blob = await response.blob();

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          this.logoDataUrl = reader.result as string;
          resolve();
        };
        reader.onerror = () => {
          this.logoDataUrl = null;
          resolve();
        };
        reader.readAsDataURL(blob);
      });
    } catch {
      this.logoDataUrl = null;
    }
  }

  /**
   * Set logo from pre-loaded data URL
   */
  setLogoDataUrl(dataUrl: string | null): void {
    this.logoDataUrl = dataUrl;
  }

  // ============================================
  // Task 13.8: Main Generation Methods
  // ============================================

  /**
   * Generate complete invoice PDF
   * Requirements: 9.2, 9.9, 9.10, 9.12
   */
  async generate(invoice: Invoice, customer: Customer, settings: Settings): Promise<Blob> {
    // Reset Y position
    this.y = PDF_CONFIG.margin;

    // Render all sections
    await this.renderHeader(settings, invoice);
    this.renderBillToFrom(customer, settings);
    this.renderServicesTable(invoice.services);
    this.renderNotesAndSummary(invoice, settings);
    this.renderPaymentDetailsAndFooter(settings);

    // Generate PDF blob
    return this.doc.output('blob');
  }

  /**
   * Get PDF as data URL for preview
   */
  getDataUrl(): string {
    return this.doc.output('dataurlstring');
  }
}

// ============================================
// PdfService Interface Implementation
// ============================================

/**
 * Load a logo file and convert to data URL
 */
async function loadLogoAsDataUrl(logoUrl?: string): Promise<string | null> {
  if (!logoUrl) {
    return null;
  }

  try {
    const response = await fetch(logoUrl);
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Generate invoice PDF as a Blob
 *
 * @param invoice - Invoice data
 * @param customer - Customer data
 * @param settings - Application settings including logo URL
 * @returns Promise resolving to PDF Blob
 *
 * @requirements 9.2 Embed logo from settings
 * @requirements 9.9 Complete generation within 3 seconds
 * @requirements 9.10 File size under 5MB
 * @requirements 9.12 Graceful logo fallback
 *
 * @example
 * ```typescript
 * const blob = await generateInvoicePdf(invoice, customer, settings);
 * // Download or display the blob
 * ```
 */
export async function generateInvoicePdf(
  invoice: Invoice,
  customer: Customer,
  settings: Settings
): Promise<Blob> {
  const generator = new InvoicePdfGenerator();

  // Load logo with graceful fallback
  const logoDataUrl = await loadLogoAsDataUrl(settings.logoUrl);
  generator.setLogoDataUrl(logoDataUrl);

  // Generate PDF
  return generator.generate(invoice, customer, settings);
}

/**
 * Generate invoice PDF preview as data URL
 *
 * @param invoice - Invoice data
 * @param customer - Customer data
 * @param settings - Application settings including logo URL
 * @returns Promise resolving to data URL string for preview
 *
 * @example
 * ```typescript
 * const dataUrl = await previewInvoice(invoice, customer, settings);
 * // Use in iframe: <iframe src={dataUrl} />
 * ```
 */
export async function previewInvoice(
  invoice: Invoice,
  customer: Customer,
  settings: Settings
): Promise<string> {
  const generator = new InvoicePdfGenerator();

  // Load logo with graceful fallback
  const logoDataUrl = await loadLogoAsDataUrl(settings.logoUrl);
  generator.setLogoDataUrl(logoDataUrl);

  // Generate PDF
  await generator.generate(invoice, customer, settings);

  // Return as data URL
  return generator.getDataUrl();
}

/**
 * PdfService object for convenient imports
 */
export const PdfService = {
  generateInvoicePdf,
  previewInvoice,
};

export default PdfService;
