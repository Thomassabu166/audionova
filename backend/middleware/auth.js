const { admin } = require('../config/firebase-admin');

/**
 * 🔒 HARDENED Firebase ID Token Verification
 * 
 * SECURITY REQUIREMENTS:
 * - ONLY accepts Authorization: Bearer <token>
 * - ONLY trusts admin.auth().verifyIdToken()
 * - REJECTS all client-decoded tokens
 * - REJECTS missing/malformed tokens
 * - LOGS all verification attempts
 */
const verifyUser = async (req, res, next) => {
  const startTime = Date.now();
  let logData = {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  };

  try {
    // 🚨 STRICT: Only Authorization header accepted
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logData.error = 'Missing Authorization header';
      console.error('🚨 AUTH VIOLATION:', logData);
      return res.status(401).json({
        success: false,
        error: 'Authorization header required',
        code: 'AUTH_HEADER_MISSING'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      logData.error = 'Invalid Authorization header format';
      console.error('🚨 AUTH VIOLATION:', logData);
      return res.status(401).json({
        success: false,
        error: 'Bearer token required',
        code: 'AUTH_HEADER_INVALID'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    if (!token || token.length < 10) {
      logData.error = 'Empty or invalid token';
      console.error('🚨 AUTH VIOLATION:', logData);
      return res.status(401).json({
        success: false,
        error: 'Valid token required',
        code: 'TOKEN_INVALID'
      });
    }

    // 🔒 CRITICAL: ONLY Firebase Admin SDK verification trusted
    const decodedToken = await admin.auth().verifyIdToken(token, true); // checkRevoked = true
    
    // 🛡️ Additional token validation
    if (!decodedToken.uid || !decodedToken.email) {
      logData.error = 'Token missing required claims';
      console.error('🚨 AUTH VIOLATION:', logData);
      return res.status(401).json({
        success: false,
        error: 'Invalid token claims',
        code: 'TOKEN_CLAIMS_INVALID'
      });
    }

    // 🔒 Attach ONLY verified token data
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      admin: decodedToken.admin === true, // Explicit boolean check
      email_verified: decodedToken.email_verified,
      auth_time: decodedToken.auth_time,
      iat: decodedToken.iat,
      exp: decodedToken.exp
    };

    // 🔍 Security audit log
    logData.uid = decodedToken.uid;
    logData.email = decodedToken.email;
    logData.hasAdminClaim = decodedToken.admin === true;
    logData.verificationTime = Date.now() - startTime;
    console.log('✅ AUTH SUCCESS:', logData);
    
    next();
  } catch (error) {
    logData.error = error.message;
    logData.errorCode = error.code;
    console.error('🚨 AUTH ERROR:', logData);
    
    // 🔒 Specific error handling for security
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired - please refresh',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        error: 'Token revoked - please sign in again',
        code: 'TOKEN_REVOKED'
      });
    }

    if (error.code === 'auth/argument-error') {
      return res.status(401).json({
        success: false,
        error: 'Malformed token',
        code: 'TOKEN_MALFORMED'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Token verification failed',
      code: 'TOKEN_VERIFICATION_FAILED'
    });
  }
};

/**
 * 🔒 HARDENED Admin Verification Middleware
 * 
 * SECURITY REQUIREMENTS:
 * - ONLY trusts server-verified admin claim
 * - REJECTS stale or missing claims
 * - LOGS all admin access attempts
 * - ASSUMES hostile environment
 */
const verifyAdmin = (req, res, next) => {
  const auditLog = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
    uid: req.user?.uid,
    email: req.user?.email
  };

  try {
    // 🚨 CRITICAL: User must be authenticated first
    if (!req.user || !req.user.uid) {
      auditLog.violation = 'Admin access without authentication';
      console.error('🚨 ADMIN VIOLATION:', auditLog);
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // 🔒 STRICT: Check ONLY server-verified admin claim
    const hasAdminClaim = req.user.admin === true;
    
    if (!hasAdminClaim) {
      auditLog.violation = 'Unauthorized admin access attempt';
      auditLog.userClaims = {
        admin: req.user.admin,
        email_verified: req.user.email_verified
      };
      console.error('🚨 ADMIN VIOLATION:', auditLog);
      
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required',
        code: 'ADMIN_REQUIRED'
      });
    }

    // 🛡️ Additional security checks
    if (!req.user.email_verified) {
      auditLog.violation = 'Unverified email attempting admin access';
      console.error('🚨 ADMIN VIOLATION:', auditLog);
      return res.status(403).json({
        success: false,
        error: 'Email verification required',
        code: 'EMAIL_UNVERIFIED'
      });
    }

    // 🔍 SUCCESS: Log admin access for audit
    auditLog.success = true;
    auditLog.adminClaim = true;
    console.log('✅ ADMIN ACCESS GRANTED:', auditLog);

    next();
  } catch (error) {
    auditLog.error = error.message;
    console.error('🚨 ADMIN VERIFICATION ERROR:', auditLog);
    return res.status(500).json({
      success: false,
      error: 'Security verification failed',
      code: 'VERIFICATION_ERROR'
    });
  }
};

/**
 * Combined middleware for admin routes
 * Verifies user authentication and admin role in one step
 */
const requireAdmin = [verifyUser, verifyAdmin];

module.exports = {
  verifyUser,
  verifyAdmin,
  requireAdmin
};