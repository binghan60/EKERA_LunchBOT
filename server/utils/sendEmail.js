import nodemailer from 'nodemailer';

const sendErrorEmail = async (subject, error) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ALERT_EMAIL, 
    subject: subject || '🤖 機器人錯誤通知',
    text: typeof error === 'string' ? error : JSON.stringify(error, null, 2),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('🚨 錯誤通知 Email 已發送');
  } catch (err) {
    console.error('❌ 發送錯誤 Email 失敗', err);
  }
};

export default sendErrorEmail;
