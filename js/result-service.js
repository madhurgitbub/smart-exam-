/**
 * Smart Exam Platform - Result & Scoring Service
 * Handles exam submission, grading, and result generation
 */

class ResultService {
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
   * Start exam attempt
   */
  async startAttempt(examId) {
    try {
      const client = await this.getClient();
      const user = await authService.getCurrentUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await client
        .from('exam_attempts')
        .insert([
          {
            student_id: user.id,
            exam_id: examId,
            status: 'in_progress',
            started_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        attempt: data
      };
    } catch (error) {
      console.error('Start attempt error:', error);
      return {
        success: false,
        error: error.message || 'Failed to start exam attempt'
      };
    }
  }

  /**
   * Save answer
   */
  async saveAnswer(attemptId, questionId, selectedOption) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('exam_answers')
        .upsert([
          {
            attempt_id: attemptId,
            question_id: questionId,
            selected_option: selectedOption,
            answered_at: new Date().toISOString()
          }
        ], {
          onConflict: 'attempt_id,question_id'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        answer: data
      };
    } catch (error) {
      console.error('Save answer error:', error);
      return {
        success: false,
        error: error.message || 'Failed to save answer'
      };
    }
  }

  /**
   * Get attempt answers
   */
  async getAttemptAnswers(attemptId) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('exam_answers')
        .select('*')
        .eq('attempt_id', attemptId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get attempt answers error:', error);
      return [];
    }
  }

  /**
   * Submit exam
   */
  async submitExam(attemptId, timeTakenSeconds) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('exam_attempts')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          time_taken_seconds: timeTakenSeconds
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;

      // Grade the exam
      const gradingResult = await this.gradeExam(attemptId);

      return {
        success: true,
        attempt: data,
        grading: gradingResult
      };
    } catch (error) {
      console.error('Submit exam error:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit exam'
      };
    }
  }

  /**
   * Auto-submit exam (for anti-cheat violations)
   */
  async autoSubmitExam(attemptId, reason) {
    try {
      const client = await this.getClient();

      const { data: attempt, error: fetchError } = await client
        .from('exam_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();

      if (fetchError) throw fetchError;

      const timeTaken = Math.floor(
        (new Date() - new Date(attempt.started_at)) / 1000
      );

      const { data, error } = await client
        .from('exam_attempts')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          time_taken_seconds: timeTaken
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;

      // Log violation
      await this.logViolation(
        attempt.student_id,
        attempt.exam_id,
        attemptId,
        'AUTO_SUBMIT',
        reason
      );

      // Grade the exam
      const gradingResult = await this.gradeExam(attemptId);

      return {
        success: true,
        attempt: data,
        autoSubmitted: true,
        reason,
        grading: gradingResult
      };
    } catch (error) {
      console.error('Auto-submit exam error:', error);
      return {
        success: false,
        error: error.message || 'Failed to auto-submit exam'
      };
    }
  }

  /**
   * Grade exam (calculate score and percentage)
   */
  async gradeExam(attemptId) {
    try {
      const client = await this.getClient();

      // Get all answers for this attempt
      const { data: answers, error: answersError } = await client
        .from('exam_answers')
        .select(`
          id,
          selected_option,
          question_id,
          exam_questions!question_id(correct_answer, marks)
        `)
        .eq('attempt_id', attemptId);

      if (answersError) throw answersError;

      // Get exam to get total marks
      const { data: attempt, error: attemptError } = await client
        .from('exam_attempts')
        .select('exam_id')
        .eq('id', attemptId)
        .single();

      if (attemptError) throw attemptError;

      const { data: exam, error: examError } = await client
        .from('exams')
        .select('total_marks')
        .eq('id', attempt.exam_id)
        .single();

      if (examError) throw examError;

      // Calculate score
      let totalScore = 0;
      const updates = [];

      for (const answer of answers) {
        const isCorrect = answer.selected_option === answer.exam_questions.correct_answer;
        const marks = isCorrect ? (answer.exam_questions.marks || 1) : 0;
        totalScore += marks;

        updates.push({
          id: answer.id,
          is_correct: isCorrect,
          marks_obtained: marks
        });
      }

      // Update all answers with correct flag and marks
      for (const update of updates) {
        await client
          .from('exam_answers')
          .update({
            is_correct: update.is_correct,
            marks_obtained: update.marks_obtained
          })
          .eq('id', update.id);
      }

      const percentage = (totalScore / exam.total_marks) * 100;

      // Update attempt with score and percentage
      const { data, error } = await client
        .from('exam_attempts')
        .update({
          score: totalScore,
          total_marks: exam.total_marks,
          percentage: Math.round(percentage * 100) / 100,
          status: 'evaluated'
        })
        .eq('id', attemptId)
        .select()
        .single();

      if (error) throw error;

      // Update leaderboard
      await this.updateLeaderboard(attempt.student_id);

      // Update student analytics
      await this.updateStudentAnalytics(attempt.student_id);

      return {
        success: true,
        score: totalScore,
        totalMarks: exam.total_marks,
        percentage: Math.round(percentage * 100) / 100,
        attempt: data
      };
    } catch (error) {
      console.error('Grade exam error:', error);
      return {
        success: false,
        error: error.message || 'Failed to grade exam'
      };
    }
  }

  /**
   * Get exam result
   */
  async getResult(attemptId) {
    try {
      const client = await this.getClient();

      const { data: attempt, error: attemptError } = await client
        .from('exam_attempts')
        .select(`
          *,
          exams(title, subject, total_marks),
          profiles(name, roll_no)
        `)
        .eq('id', attemptId)
        .single();

      if (attemptError) throw attemptError;

      // Get answers
      const { data: answers, error: answersError } = await client
        .from('exam_answers')
        .select(`
          *,
          exam_questions(
            question_text,
            correct_answer,
            option_a,
            option_b,
            option_c,
            option_d,
            explanation
          )
        `)
        .eq('attempt_id', attemptId);

      if (answersError) throw answersError;

      return {
        attempt,
        answers: answers || []
      };
    } catch (error) {
      console.error('Get result error:', error);
      return null;
    }
  }

  /**
   * Get student's exam attempts
   */
  async getStudentAttempts(studentId) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('exam_attempts')
        .select(`
          id,
          exam_id,
          score,
          percentage,
          time_taken_seconds,
          status,
          submitted_at,
          exams(title, subject)
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get student attempts error:', error);
      return [];
    }
  }

  /**
   * Log violation
   */
  async logViolation(studentId, examId, attemptId, violationType, description) {
    try {
      const client = await this.getClient();

      const { error } = await client
        .from('exam_violations')
        .insert([
          {
            student_id: studentId,
            exam_id: examId,
            attempt_id: attemptId,
            violation_type: violationType,
            description: description,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Log violation error:', error);
      return { success: false };
    }
  }

  /**
   * Update leaderboard
   */
  async updateLeaderboard(studentId) {
    try {
      const client = await this.getClient();

      // Get student's exam statistics
      const { data: attempts, error } = await client
        .from('exam_attempts')
        .select('score, total_marks, status')
        .eq('student_id', studentId)
        .eq('status', 'evaluated');

      if (error) throw error;

      if (attempts && attempts.length > 0) {
        const totalMarksObtained = attempts.reduce((sum, a) => sum + (a.score || 0), 0);
        const totalMarksPossible = attempts.reduce((sum, a) => sum + (a.total_marks || 0), 0);
        const averageMarks = totalMarksPossible > 0 
          ? Math.round((totalMarksObtained / totalMarksPossible) * 100 * 100) / 100 
          : 0;
        const bestScore = Math.max(...attempts.map(a => a.score || 0));

        const { error: updateError } = await client
          .from('leaderboard')
          .upsert([
            {
              student_id: studentId,
              total_exams_taken: attempts.length,
              total_marks_obtained: totalMarksObtained,
              total_marks_possible: totalMarksPossible,
              average_marks: averageMarks,
              best_score: bestScore,
              updated_at: new Date().toISOString()
            }
          ], {
            onConflict: 'student_id'
          });

        if (updateError) throw updateError;
      }

      return { success: true };
    } catch (error) {
      console.error('Update leaderboard error:', error);
      return { success: false };
    }
  }

  /**
   * Update student analytics
   */
  async updateStudentAnalytics(studentId) {
    try {
      const client = await this.getClient();

      const { data: attempts, error } = await client
        .from('exam_attempts')
        .select('score, total_marks, status')
        .eq('student_id', studentId)
        .eq('status', 'evaluated');

      if (error) throw error;

      if (attempts && attempts.length > 0) {
        const averageScore = attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length;
        const highestScore = Math.max(...attempts.map(a => a.score || 0));

        await client
          .from('student_analytics')
          .upsert([
            {
              student_id: studentId,
              total_exams_given: attempts.length,
              average_score: Math.round(averageScore * 100) / 100,
              highest_score: highestScore,
              updated_at: new Date().toISOString()
            }
          ], {
            onConflict: 'student_id'
          });
      }

      return { success: true };
    } catch (error) {
      console.error('Update student analytics error:', error);
      return { success: false };
    }
  }
}

// Export as singleton
const resultService = new ResultService();

// For inline usage
if (typeof window !== 'undefined') {
  window.resultService = resultService;
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = resultService;
}
