# 🚨 EMERGENCY ADMIN RECOVERY PROCEDURES

## ⚠️ CRITICAL WARNING

**This document contains emergency procedures for admin access recovery.**
**These procedures bypass normal security controls and should ONLY be used in genuine emergencies.**

---

## 🔒 WHEN TO USE EMERGENCY RECOVERY

Use these procedures ONLY when:

1. **Admin Gmail account is lost/suspended/compromised**
2. **Admin custom claims are accidentally removed**
3. **Firebase project access is lost**
4. **Normal admin setup script fails**

**DO NOT use for convenience or shortcuts.**

---

## 📋 PREREQUISITES

Before attempting recovery, you MUST have:

1. **Physical access to the production server/machine**
2. **Firebase service account credentials** (`firebase-service-account.json`)
3. **Firebase project admin access** (Firebase Console)
4. **Proof of identity and authorization** (documented approval)
5. **Incident documentation** (why recovery is needed)

---

## 🚨 RECOVERY PROCEDURE A: Custom Claims Reset

### When to use:
- Admin claims were accidentally removed
- Claims are corrupted or invalid
- User exists but lost admin access

### Steps:

1. **Verify Emergency Authorization**
   ```bash
   # Document the emergency
   echo "EMERGENCY RECOVERY: $(date)" >> /var/log/admin-recovery.log
   echo "Operator: [YOUR_NAME]" >> /var/log/admin-recovery.log
   echo "Reason: [EMERGENCY_REASON]" >> /var/log/admin-recovery.log
   ```

2. **Access Production Environment**
   ```bash
   # SSH to production server
   ssh production-server
   cd /path/to/application/backend
   ```

3. **Verify Firebase Credentials**
   ```bash
   # Check service account file exists
   ls -la firebase-service-account.json
   
   # Verify Firebase project ID
   grep "project_id" firebase-service-account.json
   ```

4. **Create Emergency Recovery Script**
   ```javascript
   // emergency-recovery.js
   const admin = require('firebase-admin');
   
   // Initialize with service account
   const serviceAccount = require('./firebase-service-account.json');
   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
   });
   
   async function emergencyAdminRecovery() {
     const ADMIN_EMAIL = 'thomassabu512@gmail.com';
     
     try {
       console.log('🚨 EMERGENCY ADMIN RECOVERY INITIATED');
       console.log('Time:', new Date().toISOString());
       console.log('Admin email:', ADMIN_EMAIL);
       
       // Get user by email
       const user = await admin.auth().getUserByEmail(ADMIN_EMAIL);
       console.log('User found:', user.uid);
       
       // Set admin claims
       await admin.auth().setCustomUserClaims(user.uid, {
         admin: true,
         emergencyRecovery: true,
         recoveryTime: new Date().toISOString(),
         recoveryOperator: process.env.USER || 'unknown'
       });
       
       console.log('✅ Emergency admin claims set');
       
       // Verify claims
       const updatedUser = await admin.auth().getUser(user.uid);
       console.log('Verified claims:', updatedUser.customClaims);
       
       console.log('🚨 EMERGENCY RECOVERY COMPLETE');
       
     } catch (error) {
       console.error('❌ Emergency recovery failed:', error);
       process.exit(1);
     }
   }
   
   emergencyAdminRecovery();
   ```

5. **Execute Recovery**
   ```bash
   # Run emergency recovery
   node emergency-recovery.js
   
   # Log the recovery
   echo "Recovery completed: $(date)" >> /var/log/admin-recovery.log
   ```

6. **Verify Recovery**
   ```bash
   # Test admin access
   curl -H "Authorization: Bearer [ADMIN_TOKEN]" \
        http://localhost:5009/api/admin/songs
   ```

---

## 🚨 RECOVERY PROCEDURE B: New Admin Assignment

### When to use:
- Original admin Gmail is permanently lost
- Need to assign admin to different email
- Original admin is compromised

### Steps:

1. **Get Authorization**
   - **REQUIRED**: Written approval from system owner
   - **REQUIRED**: Identity verification of new admin
   - **REQUIRED**: Incident documentation

2. **Update Hard-coded Email**
   ```bash
   # Edit the secure admin setup script
   nano backend/scripts/secure-admin-setup.js
   
   # Change this line:
   const AUTHORIZED_ADMIN_EMAIL = 'new-admin@gmail.com';
   ```

3. **Revoke Old Admin (if possible)**
   ```javascript
   // If old admin still exists
   const oldUser = await admin.auth().getUserByEmail('old-admin@gmail.com');
   await admin.auth().setCustomUserClaims(oldUser.uid, {});
   ```

4. **Set New Admin**
   ```bash
   # Run setup for new admin
   node backend/scripts/secure-admin-setup.js
   ```

5. **Update Documentation**
   - Update all references to admin email
   - Update emergency contact information
   - Update security documentation

---

## 🚨 RECOVERY PROCEDURE C: Firebase Project Recovery

### When to use:
- Lost access to Firebase Console
- Service account credentials compromised
- Project configuration corrupted

### Steps:

1. **Contact Firebase Support**
   - Provide project ID and ownership proof
   - Request access restoration
   - Follow Firebase's identity verification process

2. **Generate New Service Account**
   ```bash
   # In Firebase Console:
   # 1. Go to Project Settings > Service Accounts
   # 2. Generate new private key
   # 3. Download JSON file
   # 4. Replace firebase-service-account.json
   ```

3. **Update Environment Variables**
   ```bash
   # If using environment variables instead of file
   export FIREBASE_PROJECT_ID="your-project-id"
   export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
   export FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@project.iam.gserviceaccount.com"
   ```

4. **Test Firebase Connection**
   ```bash
   node backend/scripts/verify-security.js
   ```

---

## 📝 POST-RECOVERY PROCEDURES

After any emergency recovery:

1. **Security Audit**
   ```bash
   # Run full security verification
   node backend/scripts/verify-security.js
   
   # Check all admin users
   node backend/scripts/secure-admin-setup.js check
   ```

2. **Update Logs**
   ```bash
   # Document the recovery in system logs
   echo "Recovery completed successfully: $(date)" >> /var/log/admin-recovery.log
   echo "New admin verified: $(date)" >> /var/log/admin-recovery.log
   ```

3. **Notify Stakeholders**
   - Inform system owner of recovery
   - Update emergency contact lists
   - Schedule security review

4. **Rotate Credentials**
   - Generate new service account key
   - Update all environment variables
   - Revoke old credentials

---

## 🔒 SECURITY CONSIDERATIONS

### Recovery Risks:
- **Temporary security bypass**: Emergency procedures bypass normal controls
- **Credential exposure**: Service account keys are highly sensitive
- **Audit trail gaps**: Emergency access may not be fully logged
- **Privilege escalation**: Recovery procedures have elevated access

### Mitigation:
- **Document everything**: Log all recovery actions
- **Time-limited access**: Remove emergency flags after recovery
- **Immediate audit**: Run security verification after recovery
- **Credential rotation**: Change all keys after emergency use

---

## 📞 EMERGENCY CONTACTS

### Primary:
- **System Owner**: [CONTACT_INFO]
- **Firebase Admin**: [CONTACT_INFO]
- **Security Team**: [CONTACT_INFO]

### Secondary:
- **Firebase Support**: https://firebase.google.com/support
- **Google Cloud Support**: [SUPPORT_CASE_URL]

---

## ⚠️ LEGAL DISCLAIMER

These procedures are for authorized personnel only. Unauthorized use of these procedures may violate:

- Computer Fraud and Abuse Act
- Data protection regulations
- Terms of service agreements
- Employment agreements

**Only use in genuine emergencies with proper authorization.**

---

## 📋 RECOVERY CHECKLIST

- [ ] Emergency documented and authorized
- [ ] Physical access to production environment verified
- [ ] Firebase credentials available and verified
- [ ] Backup of current configuration created
- [ ] Recovery procedure executed successfully
- [ ] Admin access verified and tested
- [ ] Security audit completed
- [ ] Stakeholders notified
- [ ] Credentials rotated
- [ ] Documentation updated
- [ ] Emergency flags removed
- [ ] Normal operations restored

---

**Remember: These procedures bypass security controls. Use only when absolutely necessary and with proper authorization.**