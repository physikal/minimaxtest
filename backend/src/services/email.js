// Email service
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'test@ethereal.email',
    pass: process.env.SMTP_PASS || 'testpassword'
  }
});

export async function sendInviteEmail(to, game, token) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  const inviteUrl = `${baseUrl}/invite/${token}`;

  const subject = `You're invited to ${game.name}!`;
  const html = `
    <div style="font-family: 'Source Sans 3', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #ff6b35; font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px;">POKER PULSE</h1>
      <h2>You've been invited to ${game.name}</h2>
      <div style="background: #161b22; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Date:</strong> ${game.date}</p>
        <p><strong>Time:</strong> ${game.time}</p>
        <p><strong>Location:</strong> ${game.location}</p>
        <p><strong>Game Type:</strong> ${game.game_type}</p>
        ${game.buy_in ? `<p><strong>Buy-in:</strong> ${game.buy_in}</p>` : ''}
      </div>
      <a href="${inviteUrl}" style="display: inline-block; background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Invite</a>
      <p style="color: #8b949e; margin-top: 20px; font-size: 14px;">
        This invite expires in 7 days.
      </p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@pokerpulse.app',
      to,
      subject,
      html
    });
    console.log('Invite email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Failed to send invite email:', err);
    throw err;
  }
}

export async function sendWelcomeEmail(to, displayName) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

  const subject = 'Welcome to Poker Pulse!';
  const html = `
    <div style="font-family: 'Source Sans 3', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #ff6b35; font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px;">POKER PULSE</h1>
      <h2>Welcome, ${displayName}!</h2>
      <p>Thanks for joining Poker Pulse. You can now:</p>
      <ul>
        <li>Create poker games</li>
        <li>Invite friends via email</li>
        <li>Track RSVPs in real-time</li>
      </ul>
      <a href="${baseUrl}" style="display: inline-block; background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px;">Get Started</a>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@pokerpulse.app',
      to,
      subject,
      html
    });
    console.log('Welcome email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Failed to send welcome email:', err);
    throw err;
  }
}

export async function sendGameReminderEmail(to, game) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

  const subject = `Reminder: ${game.name} is coming up!`;
  const html = `
    <div style="font-family: 'Source Sans 3', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #ff6b35; font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px;">POKER PULSE</h1>
      <h2>Reminder: ${game.name}</h2>
      <p>Don't forget - the game is coming up!</p>
      <div style="background: #161b22; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Date:</strong> ${game.date}</p>
        <p><strong>Time:</strong> ${game.time}</p>
        <p><strong>Location:</strong> ${game.location}</p>
      </div>
      <a href="${baseUrl}" style="display: inline-block; background: #2ecc71; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Game</a>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@pokerpulse.app',
      to,
      subject,
      html
    });
    console.log('Reminder email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Failed to send reminder email:', err);
    throw err;
  }
}
