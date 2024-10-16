const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Path to the logo and watermark
const logoPath = path.join(__dirname, 'assets', 'logotea.png'); // Logo path
const watermarkText = 'Techease Africa'; // Watermark text

// Set up transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'techeaseafrica@gmail.com',
    pass: 'acvf oppi lzdv gxrg',
  },
});

// Function to generate a professional PDF
function generatePDF(firstName,  selectedCourse, res, email) {
  const doc = new PDFDocument({ margin: 50 });
  const pdfPath = path.join(__dirname, `${firstName}_congrats.pdf`);
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // Adding a watermark
// Pipe the PDF stream directly to the response
doc.pipe(res);

// Adding a background image (template)
const backgroundPath = path.join(__dirname, 'assets', 'letterhead.jpg'); // Path to your custom background
doc.image(backgroundPath, 0, 0, { width: doc.page.width, height: doc.page.height });



doc.moveDown(4);

// Adding the main content
doc.fontSize(13).font('Helvetica')
  .text(`Dear ${firstName},`, { align: 'left' })
  .moveDown(1)
  .font('Helvetica-Bold')
  .text('Congratulations on Your Acceptance!', { align: 'center', underline: true })
  .moveDown(1)
  .font('Helvetica')
  .text(`We are thrilled to welcome you to the November 2024 cohort of our (${selectedCourse}) at Techease Africa! Due to the high volume of applications, we carefully select only 50 students per cohort to ensure a personalized learning experience.`)
  .moveDown(2)
  .font('Helvetica-Bold')
  .text('Program Details:', { align: 'left', underline: true })
  .moveDown(0.5)
  .font('Helvetica')
  .list([
    'Classes begin: November 2nd, 2024',
    'Duration: 8 weeks',
    'Sessions: twice per week via Google Meet/video conferencing tools',
    'Mandatory participation in all sessions',
    'Final project submission in week 8',
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
  .fontStyle('italic')
  .text('Welcome to Techease Africa!', { align: 'left' })
  .moveDown(1);

// Signature and closing remarks
doc.font('Helvetica').fontSize(13)
  .text('Best regards,', { align: 'left' })
  



doc.end();

  stream.on('finish', () => {
    sendEmailWithAttachment(firstName, pdfPath, email, res);
  });
}

// Function to send the email with the generated PDF attachment
function sendEmailWithAttachment(firstName, pdfPath, email, res) {
  const mailOptions = {
    from: 'techeaseafrica@gmail.com',
    to: email,
    subject: `Welcome to Techease Africa, ${firstName}!`,
    text: `Dear ${firstName},\n\nWe are excited to have you join Techease Africa. Please find attached your welcome letter.\n\nBest regards,\nTechease Africa Team`,
    attachments: [
      {
        filename: `${firstName}_congrats.pdf`,
        path: pdfPath, // Path to the generated PDF
      }, 
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send({ status: 'error', message: 'Failed to send email' });
    } else {
      console.log('Email sent: ' + info.response);
      res.status(200).send({ status: 'success', message: 'Email sent successfully' });
      fs.unlink(pdfPath, (err) => {
        if (err) console.error('Failed to delete file:', err);
      });
    }
  });
}



// app.get('/preview-pdf', (req, res) => {
//   const firstName = "Test User";
//   const course = "Web Development";
//   const email = "test@example.com";

//   // Generate PDF with sample data
//   const doc = new PDFDocument();

//   // Set the appropriate headers for PDF display in browser
//   res.setHeader('Content-disposition', 'inline; filename="test_preview.pdf"');
//   res.setHeader('Content-type', 'application/pdf');

//   // Pipe the PDF stream directly to the response
//   doc.pipe(res);

//   // Adding a background image (template)
//   const backgroundPath = path.join(__dirname, 'assets', 'letterhead.jpg'); // Path to your custom background
//   doc.image(backgroundPath, 0, 0, { width: doc.page.width, height: doc.page.height });

  

//   doc.moveDown(4);

//   // Adding the main content
//   doc.fontSize(13).font('Helvetica')
//     .text(`Dear ${firstName},`, { align: 'left' })
//     .moveDown(1)
//     .font('Helvetica-Bold')
//     .text('Congratulations on Your Acceptance!', { align: 'center', underline: true })
//     .moveDown(1)
//     .font('Helvetica')
//     .text(`We are thrilled to welcome you to the November 2024 cohort of our (${course}) at Techease Africa! Due to the high volume of applications, we carefully select only 50 students per cohort to ensure a personalized learning experience.`)
//     .moveDown(2)
//     .font('Helvetica-Bold')
//     .text('Program Details:', { align: 'left', underline: true })
//     .moveDown(0.5)
//     .font('Helvetica')
//     .list([
//       'Classes begin: November 2nd, 2024',
//       'Duration: 8 weeks',
//       'Sessions: twice per week via Google Meet/video conferencing tools',
//       'Mandatory participation in all sessions',
//       'Final project submission in week 8',
//       '4-week internship/mentorship on real-world projects',
//     ])
//     .moveDown(1)
//     .font('Helvetica-Bold')
//     .text('Scholarship and Fees:', { align: 'left', underline: true })
//     .moveDown(0.5)
//     .font('Helvetica')
//     .text('This program is fully funded by Kayish Group of Companies. There are no school fees. However, a non-refundable monthly supportive fee of GHS 90 (or GHS 150 one-time payment) is required to sustain our operations.')
//     .moveDown(1)
//     .font('Helvetica-Bold')
//     .text('Next Steps:', { align: 'left', underline: true })
//     .moveDown(0.5)
//     .font('Helvetica')
//     .list([
//       'Keep your WhatsApp active for confirmation and onboarding.',
//       'Your course mentor will contact you a week before the training.',
//       'Get ready for a transformative learning experience!',
//     ])
//     .moveDown(1)
//     .font('Helvetica-Bold')
//     .text('Share Your Excitement!', { align: 'left', underline: true })
//     .moveDown(0.5)
//     .font('Helvetica')
//     .text('We\'d love for you to spread the word about Techease Africa and invite friends to enroll.')
//     .moveDown(1)
//     .font('Helvetica-Bold')
//     .text('Welcome to Techease Africa!', { align: 'left' })
//     .moveDown(1);

//   // Signature and closing remarks
//   doc.font('Helvetica').fontSize(13)
//     .text('Best regards,', { align: 'left' })
    

 

//   doc.end();
// });


app.post('/send-email', (req, res) => {
  const { firstName,  selectedCourse, email } = req.body;
  generatePDF(firstName,  selectedCourse, res, email);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
