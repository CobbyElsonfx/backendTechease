const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');
const Setting = require('../models/Setting');
const { scheduleJob } = require('node-schedule');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  }
});

// Function to get formatted date
function formatDate(date) {
  if (!date) return 'To be announced';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'To be announced';
    }
    return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'To be announced';
  }
}

// Function to send initial application acknowledgment
async function sendApplicationAcknowledgment({ to, firstName, selectedCourse }) {
  try {
    const mailOptions = {
      from: '"Teachease Africa" <noreply@techease.africa>',
      to,
      subject: `Thank You for Applying to Techease Africa, ${firstName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Thank You for Your Application!</h2>
          <p>Dear ${firstName},</p>
          <p>Thank you for taking the first step in your tech career journey by applying to our ${selectedCourse} program at Techease Africa.</p>
          <p>Our admissions board is currently reviewing your application. This process typically takes less than 30 minutes.</p>
          <p>While you wait, we encourage you to join our community platforms to stay updated:</p>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;">
              <a href="https://chat.whatsapp.com/JJy13uPBrR775bWbxTWhRw" style="color: #25D366; text-decoration: none;">
                <strong>📱 WhatsApp Group</strong> - Join our community chat
              </a>
            </li>
            <li style="margin-bottom: 10px;">
              <a href="https://whatsapp.com/channel/0029VavCltyF6smt3meu7k3M" style="color: #25D366; text-decoration: none;">
                <strong>📢 WhatsApp Channel</strong> - Get official updates
              </a>
            </li>
            <li style="margin-bottom: 10px;">
              <a href="https://chat.google.com/room/AAQAjAEjuNQ?cls=7" style="color: #4285F4; text-decoration: none;">
                <strong>💬 Google Chat Space</strong> - Connect with mentors
              </a>
            </li>
          </ul>
          <p>Please check your email in about 30 minutes for your admission decision and next steps.</p>
          <p>Best regards,<br>Techease Africa Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Application acknowledgment email failed:', error);
    throw error;
  }
}

// Function to schedule admission letter
function scheduleAdmissionLetter({ to, firstName, selectedCourse }) {
  // Schedule the email to be sent 30 minutes from now
  const scheduledTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
  
  scheduleJob(scheduledTime, async () => {
    try {
      await sendEmail({ to, firstName, selectedCourse });
      console.log(`Scheduled admission letter sent to ${to}`);
    } catch (error) {
      console.error('Error sending scheduled admission letter:', error);
    }
  });
}

// Function for admin notifications using Handlebars
async function sendAdminNotification({ to, subject, template, data }) {
  try {
    // Load and compile template
    const templatePath = path.join(__dirname, `../templates/${template}.hbs`);
    const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(templateContent);
    const html = compiledTemplate(data);

    const mailOptions = {
      from: '"Teachease Africa" <noreply@techease.africa>',
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Admin notification failed:', error);
    throw error;
  }
}

// Function to generate PDF
async function generatePDF(data) {
  const { firstName, selectedCourse } = data;
  
  // Get settings
  const settings = await Setting.findOne({});
  if (!settings) {
    throw new Error('Settings not found');
  }

  const nextCohortDate = settings.nextCohortDate;
  const courseDuration = settings.courseDuration || '12 weeks';
  const sessionFrequency = settings.sessionFrequency || 'twice per week';

  const formattedStartDate = formatDate(nextCohortDate);

  const doc = new PDFDocument({ margin: 50 });
  const pdfPath = path.join(__dirname, `../temp/${firstName}_congrats.pdf`);
  
  // Ensure temp directory exists
  if (!fs.existsSync(path.join(__dirname, '../temp'))) {
    fs.mkdirSync(path.join(__dirname, '../temp'));
  }

  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // Add letterhead background
  const letterheadPath = path.join(__dirname, '../assets/letterhead.jpg');
  doc.image(letterheadPath, 0, 0, { width: doc.page.width, height: doc.page.height });

  doc.moveDown(7);

  // Add content with reduced font size
  doc.fontSize(11).font('Helvetica')
    .text(`Dear ${firstName},`, { align: 'left' })
    .moveDown(1)
    .font('Helvetica-Bold')
    .text('Congratulations on Your Acceptance!', { align: 'center', underline: true })
    .moveDown(1)
    .font('Helvetica')
    .text(`We are thrilled to welcome you to the ${formattedStartDate} cohort of the ${selectedCourse} program at Techease Africa. You are among a carefully selected group of 20 exceptional individuals chosen through a competitive admissions process. Prepare to embark on a focused, high-impact learning journey designed to equip you with the skills to lead and excel in todays digital world.`)
    .moveDown(2)
    .font('Helvetica-Bold')
    .text('Program Details:', { align: 'left', underline: true })
    .moveDown(0.5)
    .font('Helvetica')
    .list([
      `Start Date: ${formattedStartDate}`,
      `Duration: ${courseDuration}`,
      `Schedule: ${sessionFrequency} sessions via Google Meet`,
      'Final project submission in week 10',
      '4-week internship/mentorship on real-world projects',
    ])
    .moveDown(1)
    .font('Helvetica-Bold')
    .text('Registration Requirements:', { align: 'left', underline: true })
    .moveDown(0.5)
    .font('Helvetica')
    .list([
      'Non-refundable registration fee of GHS 150 (Payment must be completed before program start date)',
      'Personal laptop with stable internet connection',
      'Regular attendance is mandatory for all sessions',
      'Curriculum available for review on our website',
    ])
    .moveDown(1)
    .font('Helvetica-Bold')
    .text('Next Steps:', { align: 'left', underline: true })
    .moveDown(0.5)
    .font('Helvetica')
    .list([
      'Complete your registration fee payment',
      'Review the curriculum on our website',
      'Prepare your learning environment (laptop and stable internet)',
      'Mark your calendar for the program start date',
    ])
    .moveDown(1)
    .font('Helvetica-Bold')
    .text('Important Notes:', { align: 'left', underline: true })
    .moveDown(0.5)
    .font('Helvetica')
    .text('Failure to complete payment by the start date will result in forfeiting your spot. You will need to reapply for the next cohort. Attendance is strictly monitored and is a key factor in program completion and certification.')
    .moveDown(1)
    .font('Helvetica')
    .text('Welcome to Techease Africa!', { align: 'left' })
    .moveDown(1)
    .font('Helvetica')
    .text('Best regards,', { align: 'left' });

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(pdfPath));
    stream.on('error', reject);
  });
}

async function sendEmail({ to, firstName, selectedCourse }) {
  try {
    if (!firstName) {
      console.error('Missing firstName in email data');
      throw new Error('Missing firstName in email data');
    }

    const pdfPath = await generatePDF({ 
      firstName: firstName.trim(), 
      selectedCourse: selectedCourse.trim() 
    });

    const mailOptions = {
      from: '"Teachease Africa" <noreply@techease.africa>',
      to,
      subject: `Welcome to Techease Africa, ${firstName.trim()}!`,
      text: `Dear ${firstName.trim()},\n\nWe are excited to have you join Techease Africa. Please find attached your admission letter.\n\nBest regards,\nTechease Africa Team`,
      attachments: [
        {
          filename: `${firstName.trim()}_congrats.pdf`,
          path: pdfPath,
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    // Clean up: delete the temporary PDF
    fs.unlink(pdfPath, (err) => {
      if (err) console.error('Failed to delete temporary PDF:', err);
    });

    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

module.exports = { 
  sendEmail,
  sendAdminNotification,
  sendApplicationAcknowledgment,
  scheduleAdmissionLetter
}; 