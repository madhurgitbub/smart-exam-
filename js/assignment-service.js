/**
 * Smart Exam Platform - Assignment & Storage Service
 * Handles assignment operations and file storage via Supabase Storage
 */

class AssignmentService {
  constructor() {
    this.supabaseUrl = 'https://your-project.supabase.co';
    this.supabaseKey = 'your-anonymous-key-here';
    this.bucketName = 'assignments';
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  /**
   * Get Supabase client
   */
  async getClient() {
    if (window.supabaseClient) {
      return window.supabaseClient;
    }
    return authService.initSupabase();
  }

  /**
   * Initialize storage bucket
   */
  async initializeBucket() {
    try {
      const client = await this.getClient();

      // Check if bucket exists, if not create it
      const { data, error } = await client
        .storage
        .listBuckets();

      const bucketExists = data?.some(b => b.name === this.bucketName);

      if (!bucketExists) {
        await client
          .storage
          .createBucket(this.bucketName, {
            public: false
          });

        console.log('Storage bucket initialized');
      }

      return { success: true };
    } catch (error) {
      console.error('Initialize bucket error:', error);
      return { success: false };
    }
  }

  /**
   * Get student's assignments
   */
  async getAssignments() {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('assignments')
        .select(`
          id,
          title,
          description,
          subject,
          due_date,
          max_marks,
          attachment_url,
          status,
          teacher_id,
          profiles(name)
        `)
        .eq('status', 'open')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get assignments error:', error);
      return [];
    }
  }

  /**
   * Get teacher's assignments
   */
  async getTeacherAssignments(teacherId) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('assignments')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get teacher assignments error:', error);
      return [];
    }
  }

  /**
   * Create assignment
   */
  async createAssignment(assignmentData) {
    try {
      const client = await this.getClient();
      const user = await authService.getCurrentUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await client
        .from('assignments')
        .insert([
          {
            teacher_id: user.id,
            ...assignmentData,
            status: 'open'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        assignment: data,
        message: 'Assignment created successfully'
      };
    } catch (error) {
      console.error('Create assignment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create assignment'
      };
    }
  }

  /**
   * Update assignment
   */
  async updateAssignment(assignmentId, assignmentData) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('assignments')
        .update(assignmentData)
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        assignment: data
      };
    } catch (error) {
      console.error('Update assignment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update assignment'
      };
    }
  }

  /**
   * Delete assignment
   */
  async deleteAssignment(assignmentId) {
    try {
      const client = await this.getClient();

      const { error } = await client
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      return {
        success: true,
        message: 'Assignment deleted successfully'
      };
    } catch (error) {
      console.error('Delete assignment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete assignment'
      };
    }
  }

  /**
   * Upload assignment file
   */
  async uploadFile(file, path) {
    try {
      // Validate file
      if (!file) throw new Error('No file provided');
      if (file.size > this.maxFileSize) {
        throw new Error(`File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`);
      }

      const client = await this.getClient();

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name}`;
      const storagePath = `${path}/${filename}`;

      const { data, error } = await client
        .storage
        .from(this.bucketName)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrl } = client
        .storage
        .from(this.bucketName)
        .getPublicUrl(storagePath);

      return {
        success: true,
        filename: filename,
        path: storagePath,
        url: publicUrl.publicUrl,
        message: 'File uploaded successfully'
      };
    } catch (error) {
      console.error('Upload file error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload file'
      };
    }
  }

  /**
   * Download file
   */
  async downloadFile(filePath) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .storage
        .from(this.bucketName)
        .download(filePath);

      if (error) throw error;

      // Create blob and trigger download
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filePath.split('/').pop());
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);

      return { success: true };
    } catch (error) {
      console.error('Download file error:', error);
      return {
        success: false,
        error: error.message || 'Failed to download file'
      };
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath) {
    try {
      const client = await this.getClient();

      const { error } = await client
        .storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Delete file error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete file'
      };
    }
  }

  /**
   * Submit assignment
   */
  async submitAssignment(assignmentId, file) {
    try {
      const client = await this.getClient();
      const user = await authService.getCurrentUser();

      if (!user) throw new Error('Not authenticated');

      // Upload file
      const uploadResult = await this.uploadFile(file, `submissions/${assignmentId}`);
      if (!uploadResult.success) throw new Error(uploadResult.error);

      // Create submission record
      const { data, error } = await client
        .from('assignment_submissions')
        .insert([
          {
            assignment_id: assignmentId,
            student_id: user.id,
            submission_url: uploadResult.url,
            submission_filename: uploadResult.filename,
            status: 'submitted'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        submission: data,
        message: 'Assignment submitted successfully'
      };
    } catch (error) {
      console.error('Submit assignment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit assignment'
      };
    }
  }

  /**
   * Get assignment submissions
   */
  async getSubmissions(assignmentId) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('assignment_submissions')
        .select(`
          *,
          profiles(name, roll_no)
        `)
        .eq('assignment_id', assignmentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get submissions error:', error);
      return [];
    }
  }

  /**
   * Grade submission
   */
  async gradeSubmission(submissionId, marksObtained, feedback) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('assignment_submissions')
        .update({
          marks_obtained: marksObtained,
          feedback: feedback,
          status: 'graded'
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        submission: data,
        message: 'Submission graded successfully'
      };
    } catch (error) {
      console.error('Grade submission error:', error);
      return {
        success: false,
        error: error.message || 'Failed to grade submission'
      };
    }
  }

  /**
   * Get student submissions
   */
  async getStudentSubmissions(studentId) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('assignment_submissions')
        .select(`
          *,
          assignments(title, subject, due_date, max_marks)
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get student submissions error:', error);
      return [];
    }
  }

  /**
   * Get submission analytics
   */
  async getSubmissionAnalytics(assignmentId) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('assignment_submissions')
        .select('marks_obtained, status')
        .eq('assignment_id', assignmentId);

      if (error) throw error;

      const submissions = data || [];
      const gradedSubmissions = submissions.filter(s => s.status === 'graded');

      const stats = {
        totalSubmissions: submissions.length,
        gradedSubmissions: gradedSubmissions.length,
        pendingSubmissions: submissions.filter(s => s.status !== 'graded').length,
        averageMarks: gradedSubmissions.length > 0
          ? (gradedSubmissions.reduce((sum, s) => sum + (s.marks_obtained || 0), 0) / gradedSubmissions.length).toFixed(2)
          : 0
      };

      return stats;
    } catch (error) {
      console.error('Get submission analytics error:', error);
      return {
        totalSubmissions: 0,
        gradedSubmissions: 0,
        pendingSubmissions: 0,
        averageMarks: 0
      };
    }
  }

  /**
   * Check if student has submitted
   */
  async hasStudentSubmitted(assignmentId, studentId) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('assignment_submissions')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .single();

      if (error && error.code === 'PGRST116') {
        return false; // Not found
      }

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Check submission error:', error);
      return false;
    }
  }

  /**
   * Check if assignment is overdue
   */
  isAssignmentOverdue(dueDate) {
    return new Date() > new Date(dueDate);
  }

  /**
   * Get days until due
   */
  getDaysUntilDue(dueDate) {
    const now = new Date();
    const due = new Date(dueDate);
    const days = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }
}

// Export as singleton
const assignmentService = new AssignmentService();

// For inline usage
if (typeof window !== 'undefined') {
  window.assignmentService = assignmentService;
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = assignmentService;
}
