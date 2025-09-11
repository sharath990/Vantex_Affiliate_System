import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendVerificationEmail = async (email, token, fullName, affiliateCode) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@vantex.com',
    to: email,
    subject: 'Verify Your Vantex Affiliate Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Vantex Affiliate Program!</h2>
        <p>Hello ${fullName},</p>
        <p>Thank you for registering with Vantex Affiliate Program. Your affiliate ID is: <strong>${affiliateCode}</strong></p>
        <p>Please verify your email address to complete your registration.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #374151;">Your Registration Details:</p>
          <p style="margin: 5px 0; color: #6b7280;">Affiliate ID: ${affiliateCode}</p>
          <p style="margin: 5px 0; color: #6b7280;">Email: ${email}</p>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't register for a Vantex affiliate account, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    // For development - log email instead of sending
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      console.log('\n=== EMAIL WOULD BE SENT ===');
      console.log('To:', email);
      console.log('Subject:', mailOptions.subject);
      console.log('Verification URL:', verificationUrl);
      console.log('Affiliate Code:', affiliateCode);
      console.log('========================\n');
      return { success: true };
    }
    
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};