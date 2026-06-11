/**
 * Smart Exam Platform - Utility Functions
 * Common helper functions used across the application
 */

class ExamUtils {
  /**
   * Format time duration in HH:MM:SS
   */
  static formatDuration(seconds) {
    if (!seconds || seconds < 0) return '00:00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  }

  /**
   * Format date to readable format
   */
  static formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  }

  /**
   * Format percentage
   */
  static formatPercentage(value, decimals = 2) {
    if (!value) return '0%';
    return (parseFloat(value).toFixed(decimals)) + '%';
  }

  /**
   * Calculate time remaining
   */
  static calculateTimeRemaining(endTime) {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const remaining = Math.max(0, end - now);

    return {
      milliseconds: remaining,
      seconds: Math.floor(remaining / 1000),
      minutes: Math.floor(remaining / 60000),
      hours: Math.floor(remaining / 3600000),
      formatted: this.formatDuration(Math.floor(remaining / 1000))
    };
  }

  /**
   * Check if exam is active
   */
  static isExamActive(startTime, endTime) {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    return now >= start && now <= end;
  }

  /**
   * Check if exam has started
   */
  static hasExamStarted(startTime) {
    return new Date() >= new Date(startTime);
  }

  /**
   * Check if exam has ended
   */
  static hasExamEnded(endTime) {
    return new Date() > new Date(endTime);
  }

  /**
   * Get grade from percentage
   */
  static getGrade(percentage) {
    const pct = parseFloat(percentage);

    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 40) return 'D';
    return 'F';
  }

  /**
   * Get grade color
   */
  static getGradeColor(percentage) {
    const pct = parseFloat(percentage);

    if (pct >= 90) return '#10b981'; // A+ Green
    if (pct >= 80) return '#10b981'; // A Green
    if (pct >= 70) return '#34d399'; // B+ Light Green
    if (pct >= 60) return '#f59e0b'; // B Orange
    if (pct >= 50) return '#f59e0b'; // C Orange
    if (pct >= 40) return '#f97316'; // D Dark Orange
    return '#ef4444'; // F Red
  }

  /**
   * Generate UUID
   */
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Validate email
   */
  static isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  /**
   * Validate password strength
   */
  static getPasswordStrength(password) {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return {
      score: strength,
      label: ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength - 1] || 'Very Weak'
    };
  }

  /**
   * Deep clone object
   */
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Debounce function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Show loading spinner
   */
  static showLoader(message = 'Loading...') {
    const loader = document.createElement('div');
    loader.id = 'smartexam-loader';
    loader.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      flex-direction: column;
      gap: 20px;
    `;

    loader.innerHTML = `
      <div style="
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #0d6efd;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <p style="color: white; font-size: 16px;">${message}</p>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    document.body.appendChild(loader);
    return loader;
  }

  /**
   * Hide loading spinner
   */
  static hideLoader() {
    const loader = document.getElementById('smartexam-loader');
    if (loader) {
      loader.remove();
    }
  }

  /**
   * Show toast notification
   */
  static showToast(message, type = 'info', duration = 4000) {
    const colors = {
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196f3'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${colors[type] || colors.info};
      color: white;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideUp 0.3s ease;
      font-weight: 500;
    `;

    toast.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from {
          transform: translateY(100px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideUp 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Confirm dialog
   */
  static async confirm(title, message, okText = 'OK', cancelText = 'Cancel') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 32px;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 10001;
        max-width: 400px;
      `;

      modal.innerHTML = `
        <h3 style="margin-top: 0;">${title}</h3>
        <p style="color: #666; margin: 12px 0;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="cancel-btn" style="
            padding: 8px 16px;
            background: #e0e0e0;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          ">${cancelText}</button>
          <button id="ok-btn" style="
            padding: 8px 16px;
            background: #0d6efd;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          ">${okText}</button>
        </div>
      `;

      const backdrop = document.createElement('div');
      backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
      `;

      document.body.appendChild(backdrop);
      document.body.appendChild(modal);

      modal.querySelector('#ok-btn').onclick = () => {
        modal.remove();
        backdrop.remove();
        resolve(true);
      };

      modal.querySelector('#cancel-btn').onclick = () => {
        modal.remove();
        backdrop.remove();
        resolve(false);
      };
    });
  }

  /**
   * Local storage with expiry
   */
  static setWithExpiry(key, value, expiryMinutes) {
    const now = new Date();
    const item = {
      value: value,
      expiry: now.getTime() + (expiryMinutes * 60 * 1000)
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  /**
   * Get from local storage with expiry check
   */
  static getWithExpiry(key) {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const data = JSON.parse(item);
    const now = new Date();

    if (now.getTime() > data.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return data.value;
  }

  /**
   * Export data as CSV
   */
  static exportToCSV(data, filename) {
    if (!data || data.length === 0) {
      ExamUtils.showToast('No data to export', 'warning');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get browser info
   */
  static getBrowserInfo() {
    const ua = navigator.userAgent;

    return {
      browser: this.getBrowserName(ua),
      version: this.getBrowserVersion(ua),
      os: this.getOS(ua),
      isMobile: /mobile/i.test(ua),
      isTablet: /tablet|ipad/i.test(ua),
      userAgent: ua
    };
  }

  /**
   * Get browser name
   */
  static getBrowserName(ua) {
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    return 'Unknown';
  }

  /**
   * Get browser version
   */
  static getBrowserVersion(ua) {
    const match = ua.match(/version\/(\d+)/i) || ua.match(/chrome\/(\d+)/i);
    return match ? match[1] : 'Unknown';
  }

  /**
   * Get OS
   */
  static getOS(ua) {
    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'MacOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) return 'iOS';
    return 'Unknown';
  }
}

// Export as global
if (typeof window !== 'undefined') {
  window.ExamUtils = ExamUtils;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExamUtils;
}
