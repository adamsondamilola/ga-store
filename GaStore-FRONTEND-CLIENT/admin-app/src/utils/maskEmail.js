function maskEmail(email) {
    try{
        // Split the email into username and domain
    const [username, domain] = email.split('@');
    
    // Mask all but the first character of the username
    const maskedUsername = username[0] + '*'.repeat(username.length - 1);
    
    // Optionally mask part of the domain (e.g., domain name before the TLD)
    const domainParts = domain.split('.');
    const maskedDomain = domainParts[0][0] + '*'.repeat(domainParts[0].length - 1) + '.' + domainParts[1];
    
    return `${maskedUsername}@${maskedDomain}`;
    }
    catch{
        return email;
    }
}
export default maskEmail