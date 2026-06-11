/**
 * Smart Exam Platform - Authentication Service
 * Handles all authentication operations with Supabase
 */

class AuthService {
  constructor() {
    this.supabaseUrl = 'https://gmqpzujryckquyqkjiol.supabase.co';
    this.supabaseKey = 'sb_publishable_e3R4LylBoO8oZNHDAQTX0g_Mkrhg4Bf';
    this.sessionKey = 'smartexam_auth_session';
    this.userKey = 'smartexam_user';
    this.redirectKey = 'smartexam_redirect';
  }

  /**
   * Initialize Supabase client
   */
  async initSupabase() {
    try {
      // Return already-created client first
      if (window.supabaseClient) {
        return window.supabaseClient;
      }

      const supabaseUrl =
        typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL
          ? CONFIG.SUPABASE_URL
          : this.supabaseUrl;
      const supabaseKey =
        typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_ANON_KEY
          ? CONFIG.SUPABASE_ANON_KEY
          : this.supabaseKey;

      const createClient = () => {
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
          throw new Error('Supabase library not available');
        }
        if (!window.supabaseClient) {
          window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
          console.log('Supabase client initialized successfully');
        }
        return window.supabaseClient;
      };

      // Supabase already loaded (CDN namespace is available)
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        return createClient();
      }

      // Load Supabase from CDN (dedupe if another page/service already started loading)
      const existing = document.querySelector('script[data-supabase-js="true"]');
      if (existing) {
        await new Promise((resolve, reject) => {
          if (existing.dataset.loaded === 'true') return resolve();
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener(
            'error',
            () => reject(new Error('Failed to load Supabase library from CDN')),
            { once: true }
          );
        });
        return createClient();
      }

      const script = document.createElement('script');
      script.src =
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.0/dist/umd/supabase.min.js';
      script.async = true;
      script.dataset.supabaseJs = 'true';

      return await new Promise((resolve, reject) => {
        script.onload = () => {
          script.dataset.loaded = 'true';
          try {
            resolve(createClient());
          } catch (err) {
            reject(err);
          }
        };
        script.onerror = () => {
          reject(new Error('Failed to load Supabase library from CDN'));
        };
        document.head.appendChild(script);
      });
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      throw new Error('Authentication service initialization failed: ' + error.message);
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const client = await this.initSupabase();
      const { data, error } = await client.auth.getSession();

      if (error) throw error;
      return data.session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const client = await this.initSupabase();
      const { data, error } = await client.auth.getUser();

      if (error) throw error;
      if (data.user) {
        localStorage.setItem(this.userKey, JSON.stringify(data.user));
        return data.user;
      }

      const cached = localStorage.getItem(this.userKey);
      if (cached) {
        return JSON.parse(cached);
      }

      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Sign up new user
   */
  async signup(email, password, name, role = 'student', profileData = {}) {
    try {
      if (!email || !password || !name) {
        throw new Error('Email, password, and name are required');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const client = await this.initSupabase();
      if (!client.auth) throw new Error('Supabase auth not available');

      // Support both supabase-js v2 (signUp({ email, password, options })) and v1 signatures
      let signupResp;
      try {
        signupResp = await client.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role
            }
          }
        });
      } catch (e) {
        // v1 fallback
        signupResp = await client.auth.signUp(
          { email, password },
          {
            data: {
              name,
              role
            }
          }
        );
      }

      const signupError = signupResp?.error || signupResp?.data?.error;
      if (signupError) throw signupError;

      const user = signupResp?.data?.user || signupResp?.user || null;
      const session = signupResp?.data?.session || signupResp?.session || null;

      // Create profile only when we have an authenticated session (RLS typically blocks anonymous inserts)
      if (user && session) {
        this.storeSession(session);
        await this.createProfile(user.id, email, name, role, profileData);

        const profile = await this.getUserProfile(user.id);
        localStorage.setItem(
          this.userKey,
          JSON.stringify({
            ...user,
            profile
          })
        );
      }

      return {
        success: true,
        user,
        message: 'Signup successful! Please check your email to verify your account.'
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error.message || 'Signup failed'
      };
    }
  }

  /**
   * Create user profile in database
   */
  async createProfile(userId, email, name, role, profileData = {}) {
    try {
      const client = await this.initSupabase();
      const profilePayload = {
        id: userId,
        auth_id: userId,
        email,
        name,
        role,
        is_active: true,
        updated_at: new Date().toISOString(),
        ...profileData
      };

      const { error } = await client
        .from('profiles')
        .upsert(
          [profilePayload],
          { onConflict: 'id' }
        );

      if (error) throw error;
      return profilePayload;
    } catch (error) {
      console.error('Create profile error:', error);
      throw error;
    }
  }

  /**
   * Ensure a profile exists for the authenticated user.
   * This fixes cases where signup can't insert due to email verification / missing session.
   */
  async ensureProfileExists(user, preferredRole = null) {
    try {
      if (!user?.id || !user?.email) return null;

      const existing = await this.getUserProfile(user.id);
      if (existing) return existing;

      const meta = user.user_metadata || {};
      const inferredName = meta.name || meta.full_name || user.email.split('@')[0];
      const inferredRole = preferredRole || meta.role || user.app_metadata?.role || 'student';

      const createdProfile = await this.createProfile(user.id, user.email, inferredName, inferredRole);
      return createdProfile || (await this.getUserProfile(user.id));
    } catch (error) {
      console.error('Ensure profile error:', error);
      return null;
    }
  }

  /**
   * Sign in with email and password
   */
  async login(email, password, preferredRole = null) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const client = await this.initSupabase();
      if (!client.auth) throw new Error('Supabase auth not available');

      // Support both supabase-js v2 and v1
      let loginResp;
      if (typeof client.auth.signInWithPassword === 'function') {
        loginResp = await client.auth.signInWithPassword({ email, password });
      } else if (typeof client.auth.signIn === 'function') {
        loginResp = await client.auth.signIn({ email, password });
      } else {
        throw new Error('Supabase login method not available');
      }

      const loginError = loginResp?.error || loginResp?.data?.error;
      if (loginError) throw loginError;

      const user = loginResp?.data?.user || loginResp?.user || null;
      const session = loginResp?.data?.session || loginResp?.session || null;

      if (session) {
        this.storeSession(session);

        const profile = user ? await this.ensureProfileExists(user, preferredRole) : null;
        if (user) {
          localStorage.setItem(
            this.userKey,
            JSON.stringify({
              ...user,
              profile
            })
          );
        }
      }

      return {
        success: true,
        user,
        session
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  }

  /**
   * Get user profile from database
   */
  async getUserProfile(userId) {
    try {
      const client = await this.initSupabase();

      let { data, error } = await client.from('profiles').select('*').eq('id', userId).single();

      if (!data && userId) {
        const fallback = await client.from('profiles').select('*').eq('auth_id', userId).single();
        data = fallback.data;
        error = fallback.error;
      }

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      return null;
    }
  }

  /**
   * Get a human-friendly name for teacher UI.
   */
  getDisplayName(user, profile) {
    const metadataName = (user?.user_metadata?.name || user?.user_metadata?.full_name || '').trim();
    if (metadataName && !metadataName.includes('@')) {
      return metadataName;
    }

    const profileName = (profile?.name || '').trim();
    if (profileName && !profileName.includes('@')) {
      return profileName;
    }

    const email = (user?.email || profile?.email || '').trim();
    if (email.includes('@')) {
      return email.split('@')[0];
    }

    return profileName || metadataName || 'Teacher';
  }

  /**
   * Store session in localStorage
   */
  storeSession(session) {
    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(session));
    } catch (error) {
      console.error('Store session error:', error);
    }
  }

  /**
   * Get stored session from localStorage
   */
  getStoredSession() {
    try {
      const session = localStorage.getItem(this.sessionKey);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Get stored session error:', error);
      return null;
    }
  }

  /**
   * Sign out
   */
  async logout() {
    try {
      const client = await this.initSupabase();

      const { error } = await client.auth.signOut();
      if (error) throw error;

      // Clear local storage
      this.clearSession();

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      this.clearSession();
      return { success: true };
    }
  }

  /**
   * Clear session from localStorage
   */
  clearSession() {
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.userKey);
  }

  /**
   * Clear any Supabase auth storage entries that may survive sign-out.
   */
  clearSupabaseAuthStorage() {
    const clearMatchingStorage = (storage) => {
      try {
        const keysToRemove = [];

        for (let index = 0; index < storage.length; index += 1) {
          const key = storage.key(index);
          if (!key) continue;

          if (key.startsWith('sb-') || key.includes('supabase')) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach((key) => storage.removeItem(key));
      } catch (error) {
        console.warn('Clear Supabase storage warning:', error);
      }
    };

    clearMatchingStorage(localStorage);
    clearMatchingStorage(sessionStorage);
  }

  /**

      if (client?.auth?.signOut) {
        const { error } = await client.auth.signOut({ scope: 'global' });
        if (error) throw error;
      }

      const client = await this.initSupabase();

      const { error } = await client.auth.resetPasswordForEmail(email, {
      });
    } finally {
      this.clearSession();
      this.clearSupabaseAuthStorage();

      if (error) throw error;

      return {
        success: true,
        message: 'Password reset link sent to your email'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message || 'Password reset failed'
      };
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword) {
    try {
      if (!newPassword || newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const client = await this.initSupabase();

      const { error } = await client.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      console.error('Update password error:', error);
      return {
        success: false,
        error: error.message || 'Password update failed'
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, profileData) {
    try {
      const client = await this.initSupabase();

      const allowedFields = ['name', 'email', 'role', 'roll_no', 'branch', 'semester', 'profile_image_url', 'is_active', 'auth_id'];
      const safeProfileData = Object.fromEntries(
        Object.entries(profileData || {}).filter(([key, value]) => allowedFields.includes(key) && value !== undefined)
      );

      const { error } = await client.from('profiles').update(safeProfileData).eq('id', userId);

      if (error) throw error;

      // Update cached user
      const user = await this.getCurrentUser();
      if (user) {
        const updated = { ...user, ...safeProfileData };
        localStorage.setItem(this.userKey, JSON.stringify(updated));
      }

      return {
        success: true,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message || 'Profile update failed'
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const session = await this.getSession();
      return !!session;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user role
   */
  async getUserRole() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return null;

      const profile = await this.getUserProfile(user.id);
      if (profile?.role) return profile.role;

      // Fallback for cases where profile isn't created yet
      return user.user_metadata?.role || user.app_metadata?.role || null;
    } catch (error) {
      console.error('Get user role error:', error);
      return null;
    }
  }

  /**
   * Verify email token
   */
  async verifyEmail(token) {
    try {
      const client = await this.initSupabase();
      
      const { error } = await client.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      console.error('Verify email error:', error);
      return {
        success: false,
        error: error.message || 'Email verification failed'
      };
    }
  }

  /**
   * Set redirect URL after login
   */
  setRedirectUrl(url) {
    localStorage.setItem(this.redirectKey, url);
  }

  /**
   * Get redirect URL after login
   */
  getRedirectUrl() {
    const url = localStorage.getItem(this.redirectKey);
    localStorage.removeItem(this.redirectKey);
    return url;
  }

  /**
   * Generate random class code
   */
  generateClassCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a new class
   */
  async createClass(teacherId, className, subject, description = '', batchYear = null) {
    try {
      const client = await this.initSupabase();
      const user = await this.getCurrentUser();
      const effectiveTeacherId = user?.id;

      if (!effectiveTeacherId) throw new Error('Not authenticated');

      // Ensure profile exists (FK + RLS)
      if (user) {
        await this.ensureProfileExists(user);
      }

      const classCode = this.generateClassCode();

      const { data, error } = await client
        .from('classes')
        .insert([
          {
            teacher_id: effectiveTeacherId,
            class_name: className,
            class_code: classCode,
            subject,
            description,
            batch_year: batchYear,
            is_active: true
          }
        ])
        .select();

      if (error) throw error;

      return {
        success: true,
        class: data[0],
        classCode
      };
    } catch (error) {
      console.error('Create class error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create class'
      };
    }
  }

  /**
   * Get classes for a teacher
   */
  async getTeacherClasses(teacherId) {
    try {
      const client = await this.initSupabase();

      const { data, error } = await client
        .from('classes')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get teacher classes error:', error);
      return [];
    }
  }

  /**
   * Get classes for a student (enrolled classes)
   */
  async getStudentClasses(studentId) {
    try {
      const client = await this.initSupabase();

      const { data, error } = await client
        .from('class_enrollments')
        .select('class_id, classes(*)')
        .eq('student_id', studentId);

      if (error) throw error;

      return (data || []).map(enrollment => enrollment.classes);
    } catch (error) {
      console.error('Get student classes error:', error);
      return [];
    }
  }

  /**
   * Join a class with class code
   */
  async joinClass(studentId, classCode) {
    try {
      if (!classCode || classCode.trim().length === 0) {
        throw new Error('Class code is required');
      }

      const client = await this.initSupabase();

      // Find class by code
      const { data: classData, error: classError } = await client
        .from('classes')
        .select('id')
        .eq('class_code', classCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (classError || !classData) {
        throw new Error('Invalid or inactive class code');
      }

      // Check if already enrolled
      const { data: existingEnrollment, error: checkError } = await client
        .from('class_enrollments')
        .select('id')
        .eq('class_id', classData.id)
        .eq('student_id', studentId)
        .single();

      if (!checkError && existingEnrollment) {
        throw new Error('You are already enrolled in this class');
      }

      // Enroll student
      const { data: enrollment, error: enrollError } = await client
        .from('class_enrollments')
        .insert([
          {
            class_id: classData.id,
            student_id: studentId,
            status: 'active'
          }
        ])
        .select();

      if (enrollError) throw enrollError;

      return {
        success: true,
        message: 'Successfully joined the class',
        enrollment: enrollment[0]
      };
    } catch (error) {
      console.error('Join class error:', error);
      return {
        success: false,
        error: error.message || 'Failed to join class'
      };
    }
  }

  /**
   * Get class details by code
   */
  async getClassByCode(classCode) {
    try {
      const client = await this.initSupabase();

      const { data, error } = await client
        .from('classes')
        .select('*')
        .eq('class_code', classCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get class by code error:', error);
      return null;
    }
  }

  /**
   * Get class enrollments
   */
  async getClassEnrollments(classId) {
    try {
      const client = await this.initSupabase();

      const { data, error } = await client
        .from('class_enrollments')
        .select('*, profiles(id, email, name)')
        .eq('class_id', classId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get class enrollments error:', error);
      return [];
    }
  }

  /**
   * Get exams for a class
   */
  async getClassExams(classId) {
    try {
      const client = await this.initSupabase();

      const { data, error } = await client
        .from('class_exams')
        .select('*, exams(*)')
        .eq('class_id', classId);

      if (error) throw error;

      return (data || []).map(item => item.exams);
    } catch (error) {
      console.error('Get class exams error:', error);
      return [];
    }
  }

  /**
   * Add exam to class
   */
  async addExamToClass(classId, examId) {
    try {
      const client = await this.initSupabase();

      const { data, error } = await client
        .from('class_exams')
        .insert([
          {
            class_id: classId,
            exam_id: examId
          }
        ])
        .select();

      if (error) throw error;

      return {
        success: true,
        message: 'Exam added to class',
        item: data[0]
      };
    } catch (error) {
      console.error('Add exam to class error:', error);
      return {
        success: false,
        error: error.message || 'Failed to add exam to class'
      };
    }
  }

  /**
   * Update class
   */
  async updateClass(classId, updates) {
    try {
      const client = await this.initSupabase();

      const { data, error } = await client
        .from('classes')
        .update(updates)
        .eq('id', classId)
        .select();

      if (error) throw error;

      return {
        success: true,
        message: 'Class updated successfully',
        class: data[0]
      };
    } catch (error) {
      console.error('Update class error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update class'
      };
    }
  }

  /**
   * Delete class
   */
  async deleteClass(classId) {
    try {
      const client = await this.initSupabase();

      const { error } = await client
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;

      return {
        success: true,
        message: 'Class deleted successfully'
      };
    } catch (error) {
      console.error('Delete class error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete class'
      };
    }
  }
}

// Export as singleton
const authService = new AuthService();

// For inline usage without modules
if (typeof window !== 'undefined') {
  window.authService = authService;
}

// Module export for ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = authService;
}
