/**
 * Smart Exam Platform - Anti-Cheat System
 * Comprehensive proctoring and security measures
 */

class AntiCheatSystem {
  constructor() {
    this.tabSwitchCount = 0;
    this.windowBlurCount = 0;
    this.violations = [];
    this.isExamActive = false;
    this.attemptId = null;
    this.maxTabSwitches = 3;
    this.maxWindowBlurs = 5;
    this.fullscreenEnabled = true;
    this.devtoolsCheckInterval = 1000;
  }

  /**
   * Initialize anti-cheat system for exam
   */
  async initializeForExam(attemptId) {
    this.attemptId = attemptId;
    this.isExamActive = true;
    this.tabSwitchCount = 0;
    this.windowBlurCount = 0;
    this.violations = [];

    // Setup all security measures
    this.setupTabSwitchDetection();
    this.setupWindowBlurDetection();
    this.setupDevtoolsDetection();
    this.setupRightClickBlocking();
    this.setupCopyPasteBlocking();
    this.setupKeyboardShortcutBlocking();
    this.setupRefreshWarning();
    this.setupFullscreenMode();

    console.log('Anti-cheat system initialized for attempt:', attemptId);
  }

  /**
   * Detect tab/window switching
   */
  setupTabSwitchDetection() {
    document.addEventListener('visibilitychange', async () => {
      if (!this.isExamActive) return;

      if (document.hidden) {
        this.tabSwitchCount++;

        const violation = {
          type: 'TAB_SWITCH',
          count: this.tabSwitchCount,
          timestamp: new Date().toISOString(),
          action: this.getTabSwitchAction()
        };

        this.violations.push(violation);

        // Log to database
        if (window.resultService) {
          await resultService.logViolation(
            null,
            null,
            this.attemptId,
            'TAB_SWITCH',
            `Tab switched ${this.tabSwitchCount} times`
          );
        }

        // Show warning or auto-submit
        this.handleTabSwitchViolation(violation);
      }
    });
  }

  /**
   * Get action based on tab switch count
   */
  getTabSwitchAction() {
    switch (this.tabSwitchCount) {
      case 1:
        return 'WARNING';
      case 2:
        return 'SERIOUS_WARNING';
      case 3:
        return 'AUTO_SUBMIT';
      default:
        return 'VIOLATION';
    }
  }

  /**
   * Handle tab switch violation
   */
  handleTabSwitchViolation(violation) {
    if (violation.count === 1) {
      this.showWarning(
        '⚠️ Tab Switch Detected',
        'Warning: Do not switch tabs or windows during the exam. This is your first warning.',
        'warning'
      );
    } else if (violation.count === 2) {
      this.showWarning(
        '🚨 Final Warning',
        'FINAL WARNING: Any further tab switches will result in automatic submission of the exam.',
        'danger'
      );
    } else if (violation.count >= 3) {
      this.showWarning(
        '❌ Exam Auto-Submitted',
        'Your exam has been automatically submitted due to multiple violations. This incident has been recorded.',
        'error'
      );
      this.autoSubmitExam('Multiple tab switches detected');
    }
  }

  /**
   * Detect window blur (when window loses focus)
   */
  setupWindowBlurDetection() {
    window.addEventListener('blur', async () => {
      if (!this.isExamActive) return;

      this.windowBlurCount++;

      const violation = {
        type: 'WINDOW_BLUR',
        count: this.windowBlurCount,
        timestamp: new Date().toISOString()
      };

      this.violations.push(violation);

      if (window.resultService) {
        await resultService.logViolation(
          null,
          null,
          this.attemptId,
          'WINDOW_BLUR',
          `Window blurred ${this.windowBlurCount} times`
        );
      }

      if (this.windowBlurCount <= 2) {
        this.showWarning(
          '⚠️ Focus Lost',
          'Your exam window has lost focus. Keep focused on your exam.',
          'warning'
        );
      }
    });
  }

  /**
   * Detect DevTools opening
   */
  setupDevtoolsDetection() {
    setInterval(() => {
      if (!this.isExamActive) return;

      // Check if DevTools is open by comparing window sizes
      const threshold = 160;
      const isDevtoolsOpen = window.outerWidth - window.innerWidth > threshold ||
                            window.outerHeight - window.innerHeight > threshold;

      if (isDevtoolsOpen) {
        const violation = {
          type: 'DEVTOOLS_OPEN',
          timestamp: new Date().toISOString()
        };

        this.violations.push(violation);

        if (window.resultService) {
          resultService.logViolation(
            null,
            null,
            this.attemptId,
            'DEVTOOLS_OPEN',
            'Developer tools opened during exam'
          );
        }

        this.showWarning(
          '❌ Developer Tools Detected',
          'Opening Developer Tools is not allowed during exam. Your exam will be auto-submitted.',
          'error'
        );

        this.autoSubmitExam('Developer tools opened');
      }
    }, this.devtoolsCheckInterval);
  }

  /**
   * Block right-click context menu
   */
  setupRightClickBlocking() {
    document.addEventListener('contextmenu', (e) => {
      if (!this.isExamActive) return;

      e.preventDefault();

      const violation = {
        type: 'RIGHT_CLICK',
        timestamp: new Date().toISOString()
      };

      this.violations.push(violation);

      if (window.resultService) {
        resultService.logViolation(
          null,
          null,
          this.attemptId,
          'RIGHT_CLICK',
          'Right-click attempt during exam'
        );
      }

      this.showNotification('Right-click is disabled during exam', 'warning');
      return false;
    });
  }

  /**
   * Block copy, paste, and cut operations
   */
  setupCopyPasteBlocking() {
    const blockedEvents = ['copy', 'paste', 'cut'];

    blockedEvents.forEach(event => {
      document.addEventListener(event, (e) => {
        if (!this.isExamActive) return;

        e.preventDefault();

        const violation = {
          type: event.toUpperCase() + '_ATTEMPT',
          timestamp: new Date().toISOString()
        };

        this.violations.push(violation);

        if (window.resultService) {
          resultService.logViolation(
            null,
            null,
            this.attemptId,
            violation.type,
            `${event} attempt during exam`
          );
        }

        this.showNotification(`${event.charAt(0).toUpperCase() + event.slice(1)} is disabled during exam`, 'warning');
      });
    });
  }

  /**
   * Block dangerous keyboard shortcuts
   */
  setupKeyboardShortcutBlocking() {
    const blockedShortcuts = {
      '123': 'F12',           // Developer tools
      '17': 'Ctrl+Shift+I',   // DevTools
      '18': 'Alt',            // Alt+Tab
      '91': 'Windows key',    // Windows key
      '93': 'Context menu key' // Context menu
    };

    document.addEventListener('keydown', (e) => {
      if (!this.isExamActive) return;

      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        this.handleKeyboardShortcutViolation('F12');
        return;
      }

      // Ctrl + Shift + I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        this.handleKeyboardShortcutViolation('Ctrl+Shift+I');
        return;
      }

      // Ctrl + Shift + C (Inspect element)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault();
        this.handleKeyboardShortcutViolation('Ctrl+Shift+C');
        return;
      }

      // Ctrl + Shift + K (Console)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 75) {
        e.preventDefault();
        this.handleKeyboardShortcutViolation('Ctrl+Shift+K');
        return;
      }

      // Ctrl + S (Save)
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        return;
      }

      // Alt + Left/Right (Browser back/forward)
      if (e.altKey && (e.keyCode === 37 || e.keyCode === 39)) {
        e.preventDefault();
        this.showNotification('Navigation is disabled during exam', 'warning');
        return;
      }
    });
  }

  /**
   * Handle keyboard shortcut violation
   */
  async handleKeyboardShortcutViolation(shortcut) {
    const violation = {
      type: 'KEYBOARD_SHORTCUT',
      shortcut: shortcut,
      timestamp: new Date().toISOString()
    };

    this.violations.push(violation);

    if (window.resultService) {
      await resultService.logViolation(
        null,
        null,
        this.attemptId,
        'KEYBOARD_SHORTCUT',
        `Keyboard shortcut ${shortcut} attempted`
      );
    }

    this.showWarning(
      '❌ Shortcut Blocked',
      `The keyboard shortcut ${shortcut} is not allowed during exam.`,
      'error'
    );
  }

  /**
   * Warn on page refresh
   */
  setupRefreshWarning() {
    window.addEventListener('beforeunload', (e) => {
      if (!this.isExamActive) return;

      e.preventDefault();
      e.returnValue = 'If you leave, your exam will be auto-submitted.';
      return e.returnValue;
    });
  }

  /**
   * Setup fullscreen mode
   */
  setupFullscreenMode() {
    if (!this.fullscreenEnabled) return;

    const elem = document.documentElement;

    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.warn('Fullscreen request denied:', err);
        this.showNotification('Please enable fullscreen for secure exam experience', 'warning');
      });
    }

    // Monitor fullscreen exit
    document.addEventListener('fullscreenchange', () => {
      if (!this.isExamActive) return;

      if (!document.fullscreenElement) {
        const violation = {
          type: 'EXIT_FULLSCREEN',
          timestamp: new Date().toISOString()
        };

        this.violations.push(violation);

        if (window.resultService) {
          resultService.logViolation(
            null,
            null,
            this.attemptId,
            'EXIT_FULLSCREEN',
            'Fullscreen mode exited'
          );
        }

        this.showWarning(
          '⚠️ Fullscreen Exited',
          'Please return to fullscreen mode to continue your exam.',
          'warning'
        );

        // Try to re-enter fullscreen
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(err => console.error('Reenter fullscreen failed:', err));
        }
      }
    });
  }

  /**
   * Auto-submit exam
   */
  async autoSubmitExam(reason) {
    if (!this.attemptId || !this.isExamActive) return;

    this.isExamActive = false;

    console.log('Auto-submitting exam due to:', reason);

    const form = document.getElementById('takeTestForm') ||
                  document.getElementById('examForm') ||
                  document.querySelector('form[data-exam]');

    if (form) {
      // Submit form
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
      } else {
        form.requestSubmit();
      }
    }

    // Also call API to auto-submit
    if (window.resultService) {
      await resultService.autoSubmitExam(this.attemptId, reason);
    }
  }

  /**
   * Show warning dialog
   */
  showWarning(title, message, type = 'warning') {
    // Create modal
    const modal = document.createElement('div');
    modal.className = `anticheat-modal anticheat-modal-${type}`;
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 400px;
      border-left: 4px solid ${this.getColorForType(type)};
    `;

    modal.innerHTML = `
      <h3 style="margin-top: 0; color: ${this.getColorForType(type)};">${title}</h3>
      <p style="color: #666; margin: 12px 0;">${message}</p>
      <button onclick="this.closest('.anticheat-modal').remove()" 
        style="
          padding: 8px 16px;
          background: ${this.getColorForType(type)};
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          width: 100%;
        ">
        Understood
      </button>
    `;

    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // Auto-remove backdrop when modal is closed
    modal.addEventListener('click', () => {
      backdrop.remove();
    }, { once: true });
  }

  /**
   * Show notification toast
   */
  showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${this.getColorForType(type)};
      color: white;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001;
      animation: slideIn 0.3s ease;
    `;

    toast.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Get color for warning type
   */
  getColorForType(type) {
    const colors = {
      warning: '#ff9800',
      danger: '#f44336',
      error: '#d32f2f',
      info: '#2196f3'
    };
    return colors[type] || colors.info;
  }

  /**
   * Get all violations
   */
  getViolations() {
    return this.violations;
  }

  /**
   * End exam (cleanup)
   */
  endExam() {
    this.isExamActive = false;
    console.log('Exam ended. Total violations:', this.violations.length);

    // Exit fullscreen if in fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error('Exit fullscreen error:', err));
    }
  }

  /**
   * Stop anti-cheat system (alias for endExam)
   */
  stop() {
    this.endExam();
  }

  /**
   * Get exam status report
   */
  getStatusReport() {
    return {
      isActive: this.isExamActive,
      tabSwitches: this.tabSwitchCount,
      windowBlurs: this.windowBlurCount,
      totalViolations: this.violations.length,
      violations: this.violations,
      duration: this.getDurationString()
    };
  }

  /**
   * Get duration string
   */
  getDurationString() {
    const now = new Date();
    // This would need startTime to be tracked
    return 'N/A';
  }
}

// Export as singleton
const antiCheatSystem = new AntiCheatSystem();

// For inline usage
if (typeof window !== 'undefined') {
  window.antiCheatSystem = antiCheatSystem;
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = antiCheatSystem;
}
