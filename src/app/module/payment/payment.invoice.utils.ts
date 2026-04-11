import PDFDocument from 'pdfkit';

export interface InvoiceData {
  invoiceId: string;
  userName: string;
  userEmail: string;
  movieTitle: string;
  purchaseType: string;
  amount: number;
  transactionId: string;
  paymentDate: string;
}

export const generateInvoicePdf = async (
  data: InvoiceData,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      const chunks: Buffer[] = [];

      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      /* ================= HEADER ================= */
      doc.fontSize(22).text('MOVIE INVOICE', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10).text('FilmSphere Platform', { align: 'center' });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      /* ================= INFO ================= */
      doc.fontSize(12).text(`Invoice ID: ${data.invoiceId}`);
      doc.text(`Customer: ${data.userName}`);
      doc.text(`Email: ${data.userEmail}`);
      doc.text(`Movie: ${data.movieTitle}`);
      doc.text(`Type: ${data.purchaseType}`);
      doc.text(`Transaction: ${data.transactionId}`);
      doc.text(`Date: ${data.paymentDate}`);
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      /* ================= AMOUNT ================= */
      doc.fontSize(14).text(`Total Amount: $${data.amount}`, {
        align: 'right',
      });

      doc.moveDown(2);
      doc.fontSize(10).text('Thank you for your purchase!', {
        align: 'center',
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
