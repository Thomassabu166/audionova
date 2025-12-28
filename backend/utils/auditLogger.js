/**
 * 🔒 SECURITY AUDIT LOGGING SYSTEM
 * 
 * Comprehensive logging for all admin-related activities
 * Provides forensic trail for security incidents
 */

const fs = require('fs').promises;
const path = require('path');

class SecurityAuditLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  async ensureLogDirectory() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * Log admin setup attempts
   */
  async logAdminSetup(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'ADMIN_SETUP',
      level: 'CRITICAL',
      ...data
    };

    await this.writeLog('admin-setup.log', logEntry);
    console.log('🔒 ADMIN SETUP LOG:', logEntry);
  }

  /**
   * Log admin endpoint access
   */
  async logAdminAccess(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'ADMIN_ACCESS',
      level: 'HIGH',
      ...data
    };

    await this.writeLog('admin-access.log', logEntry);
    console.log('🔒 ADMIN ACCESS LOG:', logEntry);
  }

  /**
   * Log claim assignment and revocation
   */
  async logClaimChange(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'CLAIM_CHANGE',
      level: 'CRITICAL',
      ...data
    };

    await this.writeLog('claim-changes.log', logEntry);
    console.log('🔒 CLAIM CHANGE LOG:', logEntry);
  }

  /**
   * Log security violations
   */
  async logSecurityViolation(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'SECURITY_VIOLATION',
      level: 'CRITICAL',
      ...data
    };

    await this.writeLog('security-violations.log', logEntry);
    console.error('🚨 SECURITY VIOLATION LOG:', logEntry);
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'AUTH_EVENT',
      level: 'MEDIUM',
      ...data
    };

    await this.writeLog('auth-events.log', logEntry);
  }

  /**
   * Write log entry to file
   */
  async writeLog(filename, logEntry) {
    try {
      const logPath = path.join(this.logDir, filename);
      const logLine = JSON.stringify(logEntry) + '\n';
      
      await fs.appendFile(logPath, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw - logging failures shouldn't break the application
    }
  }

  /**
   * Get recent logs for analysis
   */
  async getRecentLogs(filename, lines = 100) {
    try {
      const logPath = path.join(this.logDir, filename);
      const content = await fs.readFile(logPath, 'utf8');
      const logLines = content.trim().split('\n');
      
      return logLines
        .slice(-lines)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { raw: line };
          }
        });
    } catch (error) {
      console.error('Failed to read audit logs:', error);
      return [];
    }
  }

  /**
   * Generate security report
   */
  async generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      adminSetupAttempts: await this.getRecentLogs('admin-setup.log', 50),
      adminAccess: await this.getRecentLogs('admin-access.log', 100),
      claimChanges: await this.getRecentLogs('claim-changes.log', 50),
      securityViolations: await this.getRecentLogs('security-violations.log', 100),
      authEvents: await this.getRecentLogs('auth-events.log', 200)
    };

    // Write report to file
    const reportPath = path.join(this.logDir, `security-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    return report;
  }
}

// Singleton instance
const auditLogger = new SecurityAuditLogger();

module.exports = auditLogger;