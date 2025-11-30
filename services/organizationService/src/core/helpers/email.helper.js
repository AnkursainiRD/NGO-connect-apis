import nodemailer from 'nodemailer';
import ejs from 'ejs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { appConfig } from '#config/app.config.js';
import { logger } from '#utils/logger.js';

// Get current file directory for ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const transporter = nodemailer.createTransport({
    service:"gmail",
    host: appConfig.smtp.host,
    port: appConfig.smtp.port,
    secure: appConfig.smtp.secure,
    auth: {
        user: appConfig.smtp.user,
        pass: appConfig.smtp.pass
    }
});


/**
 * Load and render email template
 * @param {String} templateName - Name of the template file (without .ejs extension)
 * @param {Object} data - Data to pass to the template
 * @returns {Promise<String>} - Rendered HTML string
 */
async function loadEmailTemplate(templateName, data = {}) {
    try {
        // Construct the template path
        // From: src/core/helpers/email.helper.js
        // To: src/core/resources/emailTemplates/{templateName}.ejs
        const templatePath = join(__dirname, '..', 'resources', 'emailTemplates', `${templateName}.ejs`);
        
        logger.info('📧 Loading email template:', {
            templateName,
            templatePath
        });
        
        // Render the template with data
        const html = await ejs.renderFile(templatePath, data);
        
        return html;
    } catch (error) {
        logger.error('❌ Email template loading error:', {
            error: error.message,
            templateName,
            templatePath: join(__dirname, '..', 'resources', 'emailTemplates', `${templateName}.ejs`),
            stack: error.stack
        });
        throw new Error(`Failed to load email template: ${templateName}`);
    }
}

/**
 * Send Email Helper
 * @param {Object} options
 * @param {String} options.to
 * @param {String} options.subject
 * @param {String} options.html
 * @param {String} [options.text]
 */
async function sendEmail({to, subject, html, text}){
    try {
       const info = await transporter.sendMail({
        from: appConfig.smtp.user,
        to,
        subject,
        html: html||"",
        text: text||""
       });

       return { success: true, info, messageId:info.messageId, message: "Email sent successfully" };
    } catch (error) {
        logger.error("❌ Email sending error:", {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

export {
    sendEmail,
    loadEmailTemplate
}