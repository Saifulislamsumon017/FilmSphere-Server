import PDFDocument from 'pdfkit';

export interface SubscriptionInvoiceData {
  invoiceId: string;
  userName: string;
  userEmail: string;
  planType: string;
  amount: number;
  transactionId: string;

  paymentDate?: string;
  startDate: string;
  endDate: string;
}

export const generateSubscriptionInvoice = async (
  data: SubscriptionInvoiceData,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      const chunks: Buffer[] = [];

      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      /* ================= HEADER ================= */
      doc.fontSize(22).text('SUBSCRIPTION INVOICE', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10).text('FilmSphere Platform', { align: 'center' });
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      /* ================= INFO ================= */
      doc.fontSize(12).text(`Invoice ID: ${data.invoiceId}`);
      doc.text(`Customer: ${data.userName}`);
      doc.text(`Email: ${data.userEmail}`);
      doc.text(`Plan: ${data.planType}`);
      doc.text(`Transaction: ${data.transactionId}`);

      if (data.paymentDate) {
        doc.text(`Payment Date: ${data.paymentDate}`);
      }

      doc.text(`Start Date: ${data.startDate}`);
      doc.text(`End Date: ${data.endDate}`);

      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      /* ================= AMOUNT ================= */
      doc.fontSize(14).text(`Total Amount: $${data.amount}`, {
        align: 'right',
      });

      doc.moveDown(2);

      doc.fontSize(10).text('Thank you for your subscription!', {
        align: 'center',
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
