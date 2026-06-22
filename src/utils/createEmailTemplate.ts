/**
 * Generates the HTML template for notifying Timothy that a new business partner registered.
 */
export const createPartnerRegistrationAlertTemplate = (
  partnerName: string,
  partnerEmail: string
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Business Partner Registration</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f8fafc;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0;
            }
            .header {
                background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                color: #ffffff;
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
            }
            .greeting {
                font-size: 18px;
                color: #1e293b;
                margin-top: 0;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .message {
                font-size: 15px;
                color: #475569;
                margin-bottom: 25px;
            }
            .partner-details {
                background-color: #f1f5f9;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 30px;
            }
            .detail-row {
                display: flex;
                margin-bottom: 10px;
                font-size: 14px;
            }
            .detail-row:last-child {
                margin-bottom: 0;
            }
            .detail-label {
                font-weight: 600;
                color: #475569;
                width: 120px;
                flex-shrink: 0;
            }
            .detail-value {
                color: #0f172a;
            }
            .btn-container {
                text-align: center;
                margin: 30px 0;
            }
            .btn {
                background-color: #4f46e5;
                color: #ffffff !important;
                text-decoration: none;
                padding: 14px 30px;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                display: inline-block;
                box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
                transition: background-color 0.2s;
            }
            .footer {
                background-color: #f8fafc;
                padding: 25px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            .footer-text {
                color: #94a3b8;
                font-size: 13px;
                margin: 0;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                }
                .header, .content, .footer {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>👥 Partner Registration Alert</h1>
            </div>
            
            <div class="content">
                <p class="greeting">Hi Timothy,</p>
                <p class="message">
                    A new Business Partner has created an account and verified their email. They are currently waiting for admin approval. Here are their registration details:
                </p>
                
                <div class="partner-details">
                    <div class="detail-row">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${partnerName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email Address:</span>
                        <span class="detail-value">${partnerEmail}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Role:</span>
                        <span class="detail-value">Business Partner</span>
                    </div>
                </div>
                
                <p class="message">
                    You can review, approve, or reject this partner directly from the admin dashboard:
                </p>
                
                <div class="btn-container">
                    <a href="https://dashboard.fasifys.com/dashboard/approve-partners" class="btn" target="_blank">Review & Approve Partner</a>
                </div>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    This is an automated notification from the Fasifys system.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Generates the HTML template congratulating the business partner upon admin approval.
 */
export const createPartnerApprovedTemplate = (partnerName: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approved - Welcome to Fasifys!</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f8fafc;
                line-height: 1.6;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                border: 1px solid #e2e8f0;
            }
            .header {
                background: linear-gradient(135deg, #10b981 0%, #047857 100%);
                padding: 40px 30px;
                text-align: center;
            }
            .header h1 {
                color: #ffffff;
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            .content {
                padding: 40px 30px;
                text-align: center;
            }
            .success-icon {
                width: 64px;
                height: 64px;
                background-color: #d1fae5;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 25px;
            }
            .greeting {
                font-size: 20px;
                color: #1e293b;
                margin-top: 0;
                margin-bottom: 15px;
                font-weight: 600;
            }
            .message {
                font-size: 15px;
                color: #475569;
                margin-bottom: 25px;
                line-height: 1.7;
            }
            .highlight {
                font-weight: 600;
                color: #10b981;
            }
            .btn-container {
                text-align: center;
                margin: 30px 0;
            }
            .btn {
                background-color: #10b981;
                color: #ffffff !important;
                text-decoration: none;
                padding: 14px 30px;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                display: inline-block;
                box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
                transition: background-color 0.2s;
            }
            .footer {
                background-color: #f8fafc;
                padding: 25px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            .footer-text {
                color: #94a3b8;
                font-size: 13px;
                margin: 0;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                }
                .header, .content, .footer {
                    padding: 20px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Verification Successful!</h1>
            </div>
            
            <div class="content">
                <div class="success-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M22 4L12 14.01l-3-3" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                
                <p class="greeting">Congratulations, ${partnerName}!</p>
                
                <p class="message">
                    We are thrilled to inform you that your application has been accepted. 
                    You are now a <span class="highlight">verified Business Partner</span> of Fasifys!
                </p>
                
                <p class="message">
                    You can now access your account and start managing your services, bookings, and operations.
                </p>
                
                <div class="btn-container">
                    <a href="https://dashboard.fasifys.com" class="btn" target="_blank">Access Your Dashboard</a>
                </div>
                
                <p class="message" style="font-size: 14px; margin-top: 30px;">
                    Thank you for partnering with us. We look forward to a successful collaboration.
                </p>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    Best regards,<br>The Fasifys Team
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};
