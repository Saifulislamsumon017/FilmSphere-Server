/* eslint-disable @typescript-eslint/no-explicit-any */
import nodemailer from 'nodemailer';
import { envVars } from '../config/env.js';
import path from 'path';
import ejs from 'ejs';
// -------------------- EMAIL SENDER --------------------
const transporter = nodemailer.createTransport({
  host: envVars.EMAIL_SENDER.SMTP_HOST,
  secure: true,
  auth: {
    user: envVars.EMAIL_SENDER.SMTP_USER,
    pass: envVars.EMAIL_SENDER.SMTP_PASS,
  },
  port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
});

interface SendEmail {
  subject: string;
  to: string;
  templateName: string;
  templateData: Record<string, any>;
  attachment?: {
    filename: string;
    content: Buffer | string;
    contentType: string;
  }[];
}

export const sendEmail = async ({
  subject,
  to,
  templateName,
  templateData,
  attachment,
}: SendEmail) => {
  try {
    const templatePath = path.resolve(
      process.cwd(),
      `src/app/templates/${templateName}.ejs`,
    );

    const html = await ejs.renderFile(templatePath, templateData);

    const info = await transporter.sendMail({
      from: envVars.EMAIL_SENDER.SMTP_FROM,
      to,
      subject,
      html,
      attachments: attachment?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    });

    console.log(`✅ Email sent to ${to} : ${info.messageId}`);
  } catch (error: any) {
    console.error('❌ Email sending failed:', error);
  }
};

// const transporter = nodemailer.createTransport({
//   host: envVars.EMAIL_SENDER.SMTP_HOST,
//   port: Number(envVars.EMAIL_SENDER.SMTP_PORT),
//   secure: true, // Gmail 465
//   auth: {
//     user: envVars.EMAIL_SENDER.SMTP_USER,
//     pass: envVars.EMAIL_SENDER.SMTP_PASS,
//   },
// });

// interface SendEmail {
//   subject: string;
//   to: string;
//   templateName: string;
//   templateData: Record<string, any>;
//   attachment?: {
//     filename: string;
//     content: Buffer | string;
//     contentType: string;
//   }[];
// }

// export const sendEmail = async ({
//   subject,
//   to,
//   templateName,
//   templateData,
//   attachment,
// }: SendEmail) => {
//   try {
//     const templatePath = path.join(
//       process.cwd(),
//       'src',
//       'app',
//       'template',
//       `${templateName}.ejs`,
//     );

//     console.log('Template Path:', templatePath);

//     const html = await ejs.renderFile(templatePath, templateData);

//     const info = await transporter.sendMail({
//       from: envVars.EMAIL_SENDER.SMTP_FROM,
//       to,
//       subject,
//       html,
//       attachments: attachment,
//     });

//     console.log(`✅ Email sent to ${to}`);
//     console.log(info.messageId);

//     return info;
//   } catch (error) {
//     console.error('❌ EMAIL FAILED:');
//     console.error(error);
//     throw error;
//   }
// };
