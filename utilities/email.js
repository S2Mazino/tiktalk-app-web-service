const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    }
  });

let sendEmail = (sender, receiver, subject, message) => {
    //research nodemailer for sending email from node.
    // https://nodemailer.com/about/
    // https://www.w3schools.com/nodejs/nodejs_email.asp
    //create a burner gmail account 
    //make sure you add the password to the environmental variables
    //similar to the DATABASE_URL and PHISH_DOT_NET_KEY (later section of the lab)
    var mailOptions = {
        from: sender,
        to: receiver,
        subject: subject,
        text: message
      };
    transporter.sendMail(mailOptions, (err, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    //fake sending an email for now. Post a message to logs.
    console.log("*********************************************************")
    console.log('To: ' + receiver)
    console.log('From: ' + sender)
    console.log('Subject: ' + subject)
    console.log("_________________________________________________________")
    console.log(message)
    console.log("*********************************************************")

}

module.exports = { 
    sendEmail
}