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
      from: '"Trainova EduTech" <noreply@trainova.africa>',
      to,
      subject: `Thank You for Applying to Trainova EduTech, ${firstName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Thank You for Your Application!</h2>
          <p>Dear ${firstName},</p>
          <p>Thank you for taking the first step in your tech career journey by applying to our ${selectedCourse} program at Trainova EduTech.</p>
          <p>Our admissions board is currently reviewing your application. This process typically takes less than 30 minutes.</p>
          <p>While you wait, we encourage you to join our community platforms to stay updated:</p>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;">
              <a href="https://chat.whatsapp.com/IdcezUl98Z61Xfa0ImhmbZ?mode=r_t" style="color: #25D366; text-decoration: none;">
                <strong>📱 WhatsApp Group</strong> - Join our community chat
              </a>
            </li>
            <li style="margin-bottom: 10px;">
              <a href="https://whatsapp.com/channel/0029VavCltyF6smt3meu7k3M" style="color: #25D366; text-decoration: none;">
                <strong>📢 WhatsApp Channel</strong> - Get official updates
              </a>
            </li>
            <li style="margin-bottom: 10px;">
              <a href="https://www.linkedin.com/company/105547408/admin/dashboard/" style="color: #0077B5; text-decoration: none;">
                <strong>💼 LinkedIn</strong> - Follow us for professional updates
              </a>
            </li>
          </ul>
          <p>Please check your email in about 30 minutes for your admission decision and next steps.</p>
          <p>Best regards,<br>Trainova EduTech Team</p>
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
  const scheduledTime = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now 
  
  // Store the job in a persistent way
  const job = scheduleJob(scheduledTime, async () => {
    try {
      console.log(`Attempting to send admission letter to ${to} at ${new Date()}`);
      await sendEmail({ to, firstName, selectedCourse });
      console.log(`Successfully sent admission letter to ${to}`);
    } catch (error) {
      console.error('Error sending scheduled admission letter:', error);
      // If email fails, try again after 5 minutes
      setTimeout(async () => {
        try {
          console.log(`Retrying admission letter to ${to}`);
          await sendEmail({ to, firstName, selectedCourse });
          console.log(`Successfully sent admission letter on retry to ${to}`);
        } catch (retryError) {
          console.error('Failed to send admission letter even after retry:', retryError);
        }
      }, 5 * 60 * 1000); // 5 minutes
    }
  });

  // Store the job reference to prevent garbage collection
  if (!global.scheduledJobs) {
    global.scheduledJobs = new Map();
  }
  global.scheduledJobs.set(`${to}-${scheduledTime.getTime()}`, job);

  console.log(`Admission letter scheduled for ${to} at ${scheduledTime}`);
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
      from: '"Trainova EduTech" <noreply@trainova.africa>',
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
    .text(`We are thrilled to welcome you to the ${formattedStartDate} cohort of the ${selectedCourse} program at Trainova Africa. You are among a carefully selected  exceptional individuals chosen through a competitive admissions process. Prepare to embark on a focused, high-impact learning journey designed to equip you with the skills to lead and excel in todays digital world.`)
    .moveDown(2)
    .font('Helvetica-Bold')
    .text('Program Details:', { align: 'left', underline: true })
    .moveDown(0.5)
    .font('Helvetica')
    .list([
      `Start Date: ${formattedStartDate}`,
      `Duration: 12 weeks`,
      'Class Schedule:',
      '   • Tuesdays: 7:00 PM - 8:30 PM (Main Class)',
      '   • Thursdays: 7:00 PM - 8:00 PM (Student Pair Meetings)',
      '   • Saturdays: 7:00 PM - 8:30 PM (Main Class)',
      'Note: Thursday sessions are dedicated to pair programming meetings exclusively for web development students. During these sessions, you will collaborate with your assigned partner on joint projects.',
      'Final project submission in week 10',
      '4-week internship/mentorship on real-world projects',
    ])
    .moveDown(1)
    .font('Helvetica-Bold')
    .text('Program Requirements:', { align: 'left', underline: true })
    .moveDown(0.5)
    .font('Helvetica')
    .list([
      'Personal laptop with stable internet connection',
      'Regular attendance is mandatory for all sessions',
      'Curriculum available for review on our website',
    ])
    .moveDown(1)
    .font('Helvetica-Bold')
    .text('Important Program Rules:', { align: 'left', underline: true })
    .moveDown(0.5)
    .font('Helvetica')
    .text('This is a professional training program with strict attendance and participation requirements. Your commitment to regular attendance and active participation is crucial for your success. Attendance is strictly monitored and is a key factor in program completion and certification. Missing sessions without prior notice may result in removal from the program.')
    .moveDown(1)
    .font('Helvetica-Bold')
    .text('Next Steps:', { align: 'left', underline: true })
    .moveDown(0.5)
    .font('Helvetica')
    .list([
      'Review the curriculum on our website',
      'Prepare your learning environment (laptop and stable internet)',
      'Mark your calendar for the program start date',
    ])
    .moveDown(1)
    .font('Helvetica')
    .text('Welcome to Trainova Africa!', { align: 'left' })
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
      from: '"Trainova EduTech" <noreply@trainova.africa>',
      to,
      subject: `Welcome to Trainova EduTech, ${firstName.trim()}!`,
      text: `Dear ${firstName.trim()},\n\nWe are excited to have you join Trainova EduTech. Please find attached your admission letter.\n\nBest regards,\nTrainova EduTech Team`,
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

async function sendNewsletterSubscriptionEmail({ to}) {
  try {
    const mailOptions = {
      from: '"Trainova EduTech" <noreply@trainova.africa>',
      to,
      subject: `Thank You for Subscribing to Trainova EduTech`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Thank You for Subscribing to Trainova EduTech!</h2>
         
          <p>Thank you for subscribing to our newsletter. You will receive updates about our upcoming programs, events, and other relevant information.</p>
          <p>We value your interest and look forward to sharing more about our mission and impact.</p>
          <p>Best regards,<br>Trainova EduTech Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Newsletter subscription email failed:', error);
    throw error;
  }
}

async function sendContactEmail({ to, name, email, subject, message }) {
  try {
    const mailOptions = {
      to: 'trainova@gmail.com', // Fixed destination email for contact form submissions
      subject: `New message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong> ${message}</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Contact email failed:', error);
    throw error;
  }
}

// Function to send partner registration welcome email
async function sendPartnerWelcomeEmail({ to, name, referralCode }) {
  try {
    const mailOptions = {
      from: '"Trainova EduTech" <noreply@trainova.africa>',
      to,
      subject: `Welcome to Trainova EduTech Partner Program, ${name}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">Welcome to Trainova EduTech!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Partner Registration Confirmation</p>
          </div>
          
          <div style="padding: 30px; background: #fff;">
            <p>Dear <strong>${name}</strong>,</p>
            
            <p>Thank you for registering as a Partner with Trainova EduTech  a leading digital skills empowerment platform shaping the next generation of African tech talents.</p>
            
            <p>As a partner, you play a critical role in helping us achieve our mission of equipping 1 million African youth with practical, job-ready tech skills by 2034.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">💼 How You Earn:</h3>
              <p>You receive <strong>GHS 50</strong> for every person you refer who successfully enrolls and pays for any of our courses.</p>
              <p>Each partner receives a unique referral code and link. When someone uses your code to register and pays for a course, the system logs the referral.</p>
              <p>Commissions are tracked in your partner dashboard and paid monthly to your preferred account/mobile wallet.</p>
            </div>
            
            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">🎓 Courses We Offer:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Web Development</li>
                <li>Graphic Design</li>
                <li>Data Science</li>
                <li>Social Media & Digital Marketing</li>
                <li>...and more, delivered 100% online by expert tutors.</li>
              </ul>
            </div>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">📋 Terms & Conditions:</h3>
              <p>Please find attached your Partner Agreement Document. This outlines your rights, responsibilities, and our payout process.</p>
              <p><strong>You must:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Promote Trainova EduTech courses honestly and professionally.</li>
                <li>Not use spam, fake leads, or deceptive methods.</li>
                <li>Respect our brand reputation and comply with the agreement at all times.</li>
              </ul>
            </div>
            
            <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">📌 Next Steps:</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>✅ Check your dashboard for your referral code and stats</li>
                <li>✅ Read the attached Partner Agreement carefully</li>
                <li>✅ Start promoting to your audience</li>
              </ul>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #2c3e50; margin-top: 0;">Your Referral Code:</h3>
              <div style="background: #fff; padding: 15px; border: 2px solid #667eea; border-radius: 8px; display: inline-block; font-family: monospace; font-size: 18px; font-weight: bold; color: #667eea;">
                ${referralCode}
              </div>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Save this code! You'll need it to track your referrals.</p>
            </div>
            
            <p>We are excited to have you on board. Let's grow Africa's digital future together!</p>
            
            <p style="margin-top: 30px;">
              Warm regards,<br>
              <strong>Trainova EduTech Team</strong><br>
              📧 techeaseafrica@gmail.com<br>
              🌐 www.techeaseafrica.com
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>This email was sent to ${to} as part of your Trainova EduTech partner registration.</p>
            <p>If you have any questions, please contact us at techeaseafrica@gmail.com</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'Partner_Agreement_Document.pdf',
          path: './assets/partnershipdocs.jpg',
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Partner welcome email failed:', error);
    throw error;
  }
}

// Function to send application rejection email
async function sendRejectionEmail({ to, firstName, selectedCourse, reviewNotes }) {
  try {
    const mailOptions = {
      from: '"Trainova EduTech" <noreply@trainova.africa>',
      to,
      subject: `Application Update - ${firstName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">Application Review Complete</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Trainova EduTech</p>
          </div>
          
          <div style="padding: 30px; background: #fff;">
            <p>Dear <strong>${firstName}</strong>,</p>
            
            <p>Thank you for your interest in our ${selectedCourse} program at Trainova EduTech. We have carefully reviewed your application.</p>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin-top: 0;">Application Status: Not Approved</h3>
              <p style="color: #7f1d1d;">
                After careful consideration, we regret to inform you that your application for the ${selectedCourse} program has not been approved at this time.
              </p>
            </div>
            
            ${reviewNotes ? `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #2c3e50; margin-top: 0;">Review Notes:</h4>
              <p style="color: #6c757d;">${reviewNotes}</p>
            </div>
            ` : ''}
            
            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">What's Next?</h3>
              <ul style="margin: 10px 0; padding-left: 20px; color: #2c3e50;">
                <li>Consider applying for future cohorts</li>
                <li>Strengthen your application based on feedback</li>
                <li>Explore our other programs that might be a better fit</li>
                <li>Join our newsletter to stay updated on new opportunities</li>
              </ul>
            </div>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Stay Connected</h3>
              <p style="color: #2c3e50;">
                We encourage you to stay connected with us for future opportunities:
              </p>
              <ul style="margin: 10px 0; padding-left: 20px; color: #2c3e50;">
                <li>Follow us on social media for updates</li>
                <li>Join our community platforms</li>
                <li>Attend our information sessions</li>
              </ul>
            </div>
            
            <p>We appreciate your interest in Trainova EduTech and wish you the best in your future endeavors.</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>Trainova EduTech Admissions Team</strong><br>
              📧 techeaseafrica@gmail.com<br>
              🌐 www.techeaseafrica.com
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>This email was sent to ${to} regarding your application to Trainova EduTech.</p>
            <p>If you have any questions, please contact us at techeaseafrica@gmail.com</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Rejection email failed:', error);
    throw error;
  }
}

module.exports = {
  sendEmail,
  sendAdminNotification,
  sendApplicationAcknowledgment,
  scheduleAdmissionLetter,
  sendNewsletterSubscriptionEmail,
  sendContactEmail,
  sendPartnerWelcomeEmail,
  sendRejectionEmail
}; 