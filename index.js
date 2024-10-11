const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
// use nodemone
const nodemon = require('nodemon');
 const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());
// use nodemon

// Set up transporter (you can use a real email service like Gmail, Mailgun, SendGrid, etc.)
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use other services too
  auth: {
    user: 'techeaseafrica@gmail.com',
    pass: 'acvf oppi lzdv gxrg',
  },
});
 
app.post('/send-email', (req, res) => {
  const { firstName, email } = req.body;
  console.log(firstName, email);

  const mailOptions = {
    from: 'techeaseafrica@gmail.com',
    to: email,
    subject: 'Thank you for applying',
    text: `Dear ${firstName},\n\nThank you for submitting your application!\n\nBest regards,\nYour Team`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send({ status: 'error', message: 'Failed to send email' });
    } else {
      console.log('Email sent: ' + info.response);
      res.status(200).send({ status: 'success', message: 'Email sent successfully' });
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
