package com.hireconnect.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.hireconnect.entity.CompanyDemoDetails;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import java.time.format.DateTimeFormatter;

@Service
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Value("${app.admin.email}")
    private String adminEmail;
    
    @Value("${app.company.name:Truerize HRMS}")
    private String companyName;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    /**
     * Send demo registration notification to admin
     */
    public void sendDemoRegistrationEmail(CompanyDemoDetails demoDetails) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(adminEmail);
            helper.setSubject("🎯 New Demo Request - " + demoDetails.getCompanyName());
            
            String emailBody = buildDemoRegistrationEmailBody(demoDetails);
            helper.setText(emailBody, true); // true = HTML content
            
            mailSender.send(message);
            logger.info("Demo registration email sent successfully to admin for company: {}", 
                       demoDetails.getCompanyName());
            
        } catch (MessagingException e) {
            logger.error("Failed to send demo registration email for company: {}", 
                        demoDetails.getCompanyName(), e);
            // Don't throw exception - we don't want email failure to block registration
        }
    }
    
    /**
     * Build HTML email body with demo details
     */
    private String buildDemoRegistrationEmailBody(CompanyDemoDetails demoDetails) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");
        String formattedDate = demoDetails.getCreatedAt().format(formatter);
        
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); 
                              color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .header h1 { margin: 0; font-size: 24px; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .info-box { background: white; border-left: 4px solid #667eea; padding: 20px; 
                               margin: 20px 0; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                    .info-row:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #4b5563; width: 150px; flex-shrink: 0; }
                    .value { color: #1f2937; flex-grow: 1; }
                    .status-badge { display: inline-block; padding: 5px 15px; background: #fef3c7; 
                                   color: #92400e; border-radius: 20px; font-size: 12px; font-weight: bold; }
                    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
                    .action-btn { display: inline-block; background: #667eea; color: white; 
                                 padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                                 margin: 20px 0; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎯 New Demo Request Received</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">%s</p>
                    </div>
                    
                    <div class="content">
                        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                            A new company has requested a demo. Here are the details:
                        </p>
                        
                        <div class="info-box">
                            <div class="info-row">
                                <span class="label">📋 Request ID:</span>
                                <span class="value">#%d</span>
                            </div>
                            <div class="info-row">
                                <span class="label">👤 Full Name:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="label">🏢 Company Name:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="label">📧 Email:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="label">📱 Phone:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="label">💼 Designation:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="label">📅 Requested On:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="label">🔔 Status:</span>
                                <span class="value"><span class="status-badge">%s</span></span>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <p style="color: #6b7280; font-size: 14px;">
                                Please review this request and schedule the demo accordingly.
                            </p>
                        </div>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated notification from %s</p>
                        <p>© 2026 %s. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            companyName,
            demoDetails.getId(),
            demoDetails.getFullName(),
            demoDetails.getCompanyName(),
            demoDetails.getCompanyEmail(),
            demoDetails.getPhoneNumber(),
            demoDetails.getDesignation(),
            formattedDate,
            demoDetails.getStatus().name(),
            companyName,
            companyName
        );
    }
    
    /**
     * Send confirmation email to the user who requested the demo
     */
    public void sendDemoConfirmationToUser(CompanyDemoDetails demoDetails) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(demoDetails.getCompanyEmail());
            helper.setSubject("Demo Request Received - " + companyName);
            
            String emailBody = buildUserConfirmationEmailBody(demoDetails);
            helper.setText(emailBody, true);
            
            mailSender.send(message);
            logger.info("Confirmation email sent to user: {}", demoDetails.getCompanyEmail());
            
        } catch (MessagingException e) {
            logger.error("Failed to send confirmation email to user: {}", 
                        demoDetails.getCompanyEmail(), e);
        }
    }
    
    /**
     * Build confirmation email for the user
     */
    private String buildUserConfirmationEmailBody(CompanyDemoDetails demoDetails) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); 
                              color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .highlight-box { background: white; border: 2px solid #667eea; padding: 20px; 
                                    margin: 20px 0; border-radius: 8px; text-align: center; }
                    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Demo Request Confirmed</h1>
                    </div>
                    
                    <div class="content">
                        <p>Hi <strong>%s</strong>,</p>
                        
                        <p>Thank you for your interest in %s! We've received your demo request.</p>
                        
                        <div class="highlight-box">
                            <h3 style="color: #667eea; margin-top: 0;">🎉 What's Next?</h3>
                            <p>Our team will review your request and reach out to you within <strong>24-48 hours</strong> 
                               to schedule a personalized demo at your convenience.</p>
                        </div>
                        
                        <p><strong>Your Request Details:</strong></p>
                        <ul style="background: white; padding: 20px 40px; border-radius: 5px;">
                            <li>Company: %s</li>
                            <li>Email: %s</li>
                            <li>Phone: %s</li>
                        </ul>
                        
                        <p>If you have any immediate questions, feel free to reply to this email.</p>
                        
                        <p>Best regards,<br><strong>%s Team</strong></p>
                    </div>
                    
                    <div class="footer">
                        <p>© 2026 %s. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """,
            demoDetails.getFullName(),
            companyName,
            demoDetails.getCompanyName(),
            demoDetails.getCompanyEmail(),
            demoDetails.getPhoneNumber(),
            companyName,
            companyName
        );
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Password Reset Request - " + companyName);

            String emailBody = String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #0f172a; color: white; padding: 24px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 24px; border-radius: 0 0 10px 10px; }
                        .action-btn { display: inline-block; background: #1d4ed8; color: white; 
                                     padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                                     font-weight: bold; }
                        .muted { color: #6b7280; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>Password Reset</h2>
                        </div>
                        <div class="content">
                            <p>We received a request to reset your password. Click the button below to continue:</p>
                            <p style="text-align: center; margin: 24px 0;">
                                <a class="action-btn" href="%s">Reset Password</a>
                            </p>
                            <p>If you did not request a password reset, you can safely ignore this email.</p>
                            <p class="muted">This link expires in 15 minutes.</p>
                        </div>
                    </div>
                </body>
                </html>
                """, resetLink);

            helper.setText(emailBody, true);
            mailSender.send(message);
            logger.info("Password reset email sent to user: {}", toEmail);
        } catch (MessagingException e) {
            logger.error("Failed to send password reset email to user: {}", toEmail, e);
        }
    }
}