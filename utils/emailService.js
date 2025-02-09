const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');
const Setting = require('../models/Setting');

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
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
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
  const settings = await Setting.find({
    key: { $in: ['nextCohortDate', 'courseDuration', 'sessionFrequency'] }
  });
  
  const nextCohortDate = settings.find(s => s.key === 'nextCohortDate')?.value;
  const courseDuration = settings.find(s => s.key === 'courseDuration')?.value || '12 weeks';
  const sessionFrequency = settings.find(s => s.key === 'sessionFrequency')?.value || 'twice per week';

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

  doc.moveDown(4);

  // Add content
  doc.fontSize(13).font('Helvetica')
    .text(`Dear ${firstName},`, { align: 'left' })
    .moveDown(1)
    .font('Helvetica-Bold')
    .text('Congratulations on Your Acceptance!', { align: 'center', underline: true })
    .moveDown(1)
    .font('Helvetica')
    .text(`We are thrilled to welcome you to the ${formattedStartDate} cohort of our (${selectedCourse}) at Techease Africa! Due to the high volume of applications, we carefully select only 50 students per cohort to ensure a personalized learning experience.`)
    .moveDown(2)
    .font('Helvetica-Bold')
    .text('Program Details:', { align: 'left', underline: true })
    .moveDown(0.5)
    .font('Helvetica')
    .list([
      `Classes begin: ${formattedStartDate}`,
      `Duration: ${courseDuration}`,
      `Sessions: ${sessionFrequency} via Google Meet/video conferencing tools`,
      'Mandatory participation in all sessions',
      'Final project submission in week 12',
      '4-week internship/mentorship on real-world projects',
    ])
    .moveDown(1)
    .font('Helvetica-Bold')
    .text('Scholarship and Fees:', { align: 'left', underline: true })
    .moveDown(0.5)
    .font('Helvetica')
    .text('This program is fully funded by Kayish Group of Companies. There are no school fees. However, a non-refundable monthly supportive fee of GHS 90 (or GHS 150 one-time payment) is required to sustain our operations.')
    .moveDown(1)
    .font('Helvetica-Bold')
    .text('Next Steps:', { align: 'left', underline: true })
    .moveDown(0.5)
    .font('Helvetica')
    .list([
      'Keep your WhatsApp active for confirmation and onboarding.',
      'Your course mentor will contact you a week before the training.',
      'Get ready for a transformative learning experience!',
    ])
    .moveDown(1)
    .font('Helvetica-Bold')
    .text('Share Your Excitement!', { align: 'left', underline: true })
    .moveDown(0.5)
    .font('Helvetica')
    .text('We\'d love for you to spread the word about Techease Africa and invite friends to enroll.')
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
    const pdfPath = await generatePDF({ firstName, selectedCourse });

    const mailOptions = {
      from: '"Teachease Africa" <noreply@techease.africa>',
      to,
      subject: `Welcome to Teachease Africa, ${firstName}!`,
      text: `Dear ${firstName},\n\nWe are excited to have you join Techease Africa. Please find attached your admission letter.\n\nBest regards,\nTechease Africa Team`,
      attachments: [
        {
          filename: `${firstName}_congrats.pdf`,
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
  sendAdminNotification 
}; 