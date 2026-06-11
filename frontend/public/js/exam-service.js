/**
 * Smart Exam Platform - Exam Service
 * Handles exam operations (create, fetch, update, delete)
 */

class ExamService {
  constructor() {
    this.supabaseUrl = 'https://your-project.supabase.co';
    this.supabaseKey = 'your-anonymous-key-here';
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
   * Get all available exams for student
   */
  async getAvailableExams() {
    try {
      const client = await this.getClient();
      
      const { data, error } = await client
        .from('exams')
        .select(`
          id,
          title,
          description,
          subject,
          exam_code,
          duration_minutes,
          total_marks,
          status,
          start_time,
          end_time,
          instructions,
          teacher_id,
          profiles!exams_teacher_id_fkey(name)
        `)
        .in('status', ['active', 'scheduled'])
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get available exams error:', error);
      return [];
    }
  }

  /**
   * Get exam details with questions
   */
  async getExamDetails(examId) {
    try {
      const client = await this.getClient();
      
      const { data: exam, error: examError } = await client
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;

      const { data: questions, error: questionsError } = await client
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('question_order', { ascending: true });

      if (questionsError) throw questionsError;

      return {
        ...exam,
        questions: questions || []
      };
    } catch (error) {
      console.error('Get exam details error:', error);
      return null;
    }
  }

  /**
   * Create new exam
   */
  async createExam(examData) {
    try {
      const client = await this.getClient();
      const user = await authService.getCurrentUser();

      if (!user) throw new Error('Not authenticated');

      // Make sure public.profiles row exists for FK + RLS
      if (typeof authService.ensureProfileExists === 'function') {
        const profile = await authService.ensureProfileExists(user);
        if (!profile) {
          throw new Error('Teacher profile is missing. Please sign out and sign in again.');
        }
      }

      const examCode = examData.exam_code || this.generateExamCode();

      const { data, error } = await client
        .from('exams')
        .insert([
          {
            teacher_id: user.id,
            exam_code: examCode,
            ...examData,
            status: 'draft'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        exam: data,
        examCode,
        message: 'Exam created successfully'
      };
    } catch (error) {
      console.error('Create exam error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create exam'
      };
    }
  }

  /**
   * Update exam
   */
  async updateExam(examId, examData) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('exams')
        .update(examData)
        .eq('id', examId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        exam: data,
        message: 'Exam updated successfully'
      };
    } catch (error) {
      console.error('Update exam error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update exam'
      };
    }
  }

  /**
   * Delete exam
   */
  async deleteExam(examId) {
    try {
      const client = await this.getClient();

      const { error } = await client
        .from('exams')
        .delete()
        .eq('id', examId);

      if (error) throw error;

      return {
        success: true,
        message: 'Exam deleted successfully'
      };
    } catch (error) {
      console.error('Delete exam error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete exam'
      };
    }
  }

  /**
   * Get teacher's exams
   */
  async getTeacherExams(teacherId) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('exams')
        .select('*')
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get teacher exams error:', error);
      return [];
    }
  }

  /**
   * Publish exam (change status from draft to scheduled)
   */
  async publishExam(examId) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('exams')
        .update({ status: 'scheduled' })
        .eq('id', examId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        exam: data,
        message: 'Exam published successfully'
      };
    } catch (error) {
      console.error('Publish exam error:', error);
      return {
        success: false,
        error: error.message || 'Failed to publish exam'
      };
    }
  }

  /**
   * Add question to exam
   */
  async addQuestion(examId, questionData) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('exam_questions')
        .insert([
          {
            exam_id: examId,
            ...questionData
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        question: data,
        message: 'Question added successfully'
      };
    } catch (error) {
      console.error('Add question error:', error);
      return {
        success: false,
        error: error.message || 'Failed to add question'
      };
    }
  }

  /**
   * Generate a short unique exam code.
   */
  generateExamCode() {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';

    for (let index = 0; index < 8; index += 1) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return code;
  }

  /**
   * Update question
   */
  async updateQuestion(questionId, questionData) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('exam_questions')
        .update(questionData)
        .eq('id', questionId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        question: data
      };
    } catch (error) {
      console.error('Update question error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update question'
      };
    }
  }

  /**
   * Delete question
   */
  async deleteQuestion(questionId) {
    try {
      const client = await this.getClient();

      const { error } = await client
        .from('exam_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      return {
        success: true,
        message: 'Question deleted successfully'
      };
    } catch (error) {
      console.error('Delete question error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete question'
      };
    }
  }

  /**
   * Get bulk questions by exam
   */
  async getExamQuestions(examId) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('question_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get exam questions error:', error);
      return [];
    }
  }

  /**
   * Check if student can attempt exam
   */
  async canAttemptExam(examId, studentId) {
    try {
      const client = await this.getClient();

      // Check if student already attempted
      const { data, error } = await client
        .from('exam_attempts')
        .select('id')
        .eq('exam_id', examId)
        .eq('student_id', studentId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No attempt found, can attempt
        return true;
      }

      if (error) throw error;

      // Attempt found, check status
      return false;
    } catch (error) {
      console.error('Can attempt exam error:', error);
      return false;
    }
  }
}

// Export as singleton
const examService = new ExamService();

// For inline usage
if (typeof window !== 'undefined') {
  window.examService = examService;
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = examService;
}
