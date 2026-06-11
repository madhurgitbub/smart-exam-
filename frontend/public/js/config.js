/**
 * Smart Exam Platform - Core Configuration
 * Centralized configuration for the entire application
 */

const CONFIG = {
  // Supabase Configuration
  SUPABASE_URL: 'https://gmqpzujryckquyqkjiol.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_e3R4LylBoO8oZNHDAQTX0g_Mkrhg4Bf',
  
  // Application Configuration
  APP_NAME: 'SmartExam',
  APP_VERSION: '1.0.0',
  APP_ENV: 'development',
  
  // Security Configuration
  SECURITY: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    passwordMinLength: 8
  },
  
  // Anti-Cheat Configuration
  ANTICHEAT: {
    maxTabSwitches: 3,
    maxWindowBlurs: 5,
    maxRefreshAttempts: 3,
    devtoolsCheckInterval: 1000,
    enableFullscreen: true,
    enableRightClickBlock: true,
    enableCopyPasteBlock: true
  },
  
  // UI Configuration
  UI: {
    toastTimeout: 4000,
    confirmDialogTimeout: 30000,
    animationDuration: 300
  },
  
  // Pagination
  PAGINATION: {
    defaultPageSize: 10,
    maxPageSize: 100
  }
};

