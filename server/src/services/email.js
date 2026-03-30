/**
 * Dummy Email System
 * In production, this would use a package like Nodemailer, SendGrid, or Resend.
 * For this project, it logs the outgoing email details.
 */

const sendEmail = async (to, subject, message) => {
    try {
        console.log(`\n====================== EMAIL DISPATCH ======================`);
        console.log(`TO:       ${to}`);
        console.log(`SUBJECT:  ${subject}`);
        console.log(`MESSAGE:  \n${message}`);
        console.log(`------------------------------------------------------------\n`);
        
        // Simulating async API call
        return new Promise((resolve) => setTimeout(() => resolve(true), 500));
    } catch (err) {
        console.error('Failed to send dummy email:', err);
        return false;
    }
};

module.exports = { sendEmail };
