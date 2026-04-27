import nodemailer from 'nodemailer';

interface EmailOptions {
  email: string;
  subject: string;
  text: string;
}

export default async (options: EmailOptions) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  await transporter.sendMail({
    from: 'abdallah nagy <me@abdallahnagy.com',
    to: options.email,
    subject: options.subject,
    text: options.text
  });
};
