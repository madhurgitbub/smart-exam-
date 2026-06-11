/**
 * Smart Exam Platform - Analytics Service
 * Handles analytics, reports, and performance metrics
 */

class AnalyticsService {
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
   * Get student dashboard analytics
   */
  async getStudentAnalytics(studentId) {
    try {
      const client = await this.getClient();

      // Get attempts
      const { data: attempts, error: attemptsError } = await client
        .from('exam_attempts')
        .select('score, total_marks, percentage, submitted_at, exams(subject)')
        .eq('student_id', studentId)
        .eq('status', 'evaluated')
        .order('submitted_at', { ascending: false });

      if (attemptsError) throw attemptsError;

      // Get leaderboard position
      const { data: leaderboard, error: leaderboardError } = await client
        .from('leaderboard')
        .select('rank, average_marks, best_score')
        .eq('student_id', studentId)
        .single();

      if (leaderboardError && leaderboardError.code !== 'PGRST116') throw leaderboardError;

      // Calculate statistics
      const stats = this.calculateStudentStats(attempts);

      return {
        stats,
        attempts: attempts || [],
        rank: leaderboard?.rank || 'N/A',
        averageMarks: leaderboard?.average_marks || 0,
        bestScore: leaderboard?.best_score || 0
      };
    } catch (error) {
      console.error('Get student analytics error:', error);
      return {
        stats: {},
        attempts: [],
        rank: 'N/A',
        averageMarks: 0,
        bestScore: 0
      };
    }
  }

  /**
   * Calculate student statistics
   */
  calculateStudentStats(attempts) {
    if (!attempts || attempts.length === 0) {
      return {
        totalExams: 0,
        averageScore: 0,
        averagePercentage: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        weakestSubject: 'N/A',
        strongestSubject: 'N/A'
      };
    }

    const scores = attempts.map(a => a.score || 0);
    const percentages = attempts.map(a => a.percentage || 0);
    const totalExams = attempts.length;
    const passingThreshold = 50; // 50% passing

    // Calculate metrics
    const averageScore = (scores.reduce((a, b) => a + b, 0) / totalExams).toFixed(2);
    const averagePercentage = (percentages.reduce((a, b) => a + b, 0) / totalExams).toFixed(2);
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    const passedExams = attempts.filter(a => (a.percentage || 0) >= passingThreshold).length;
    const passRate = ((passedExams / totalExams) * 100).toFixed(2);

    // Subject analysis
    const subjectScores = {};
    attempts.forEach(attempt => {
      const subject = attempt.exams?.subject || 'General';
      if (!subjectScores[subject]) {
        subjectScores[subject] = [];
      }
      subjectScores[subject].push(attempt.score || 0);
    });

    const subjectAverages = {};
    Object.keys(subjectScores).forEach(subject => {
      const scores = subjectScores[subject];
      subjectAverages[subject] = scores.reduce((a, b) => a + b, 0) / scores.length;
    });

    const strongestSubject = Object.keys(subjectAverages).reduce((a, b) =>
      subjectAverages[a] > subjectAverages[b] ? a : b
    );

    const weakestSubject = Object.keys(subjectAverages).reduce((a, b) =>
      subjectAverages[a] < subjectAverages[b] ? a : b
    );

    return {
      totalExams,
      averageScore: parseFloat(averageScore),
      averagePercentage: parseFloat(averagePercentage),
      highestScore,
      lowestScore,
      passRate: parseFloat(passRate),
      weakestSubject,
      strongestSubject,
      subjectAverages
    };
  }

  /**
   * Get teacher analytics
   */
  async getTeacherAnalytics(teacherId) {
    try {
      const client = await this.getClient();

      // Get teacher's exams
      const { data: exams, error: examsError } = await client
        .from('exams')
        .select('id, title, total_marks')
        .eq('teacher_id', teacherId);

      if (examsError) throw examsError;

      if (!exams || exams.length === 0) {
        return {
          totalExams: 0,
          totalStudents: 0,
          averageClassScore: 0,
          examCompletionRate: 0,
          exams: []
        };
      }

      const examIds = exams.map(e => e.id);

      // Get all attempts for these exams
      const { data: attempts, error: attemptsError } = await client
        .from('exam_attempts')
        .select('exam_id, score, total_marks, student_id')
        .in('exam_id', examIds)
        .eq('status', 'evaluated');

      if (attemptsError) throw attemptsError;

      // Calculate analytics
      const analytics = this.calculateTeacherStats(exams, attempts);

      return analytics;
    } catch (error) {
      console.error('Get teacher analytics error:', error);
      return {
        totalExams: 0,
        totalStudents: 0,
        averageClassScore: 0,
        examCompletionRate: 0,
        exams: []
      };
    }
  }

  /**
   * Calculate teacher statistics
   */
  calculateTeacherStats(exams, attempts) {
    const totalExams = exams.length;
    const uniqueStudents = new Set(attempts.map(a => a.student_id)).size;

    let totalScore = 0;
    const examStats = {};

    attempts.forEach(attempt => {
      totalScore += attempt.score || 0;
      
      if (!examStats[attempt.exam_id]) {
        examStats[attempt.exam_id] = {
          attempts: 0,
          totalScore: 0
        };
      }
      examStats[attempt.exam_id].attempts++;
      examStats[attempt.exam_id].totalScore += attempt.score || 0;
    });

    const averageClassScore = attempts.length > 0
      ? (totalScore / attempts.length).toFixed(2)
      : 0;

    const examDetails = exams.map(exam => {
      const stats = examStats[exam.id];
      const attempts = stats?.attempts || 0;
      const avgScore = stats && stats.attempts > 0
        ? (stats.totalScore / stats.attempts).toFixed(2)
        : 0;

      return {
        id: exam.id,
        title: exam.title,
        totalAttempts: attempts,
        averageScore: parseFloat(avgScore),
        totalMarks: exam.total_marks
      };
    });

    return {
      totalExams,
      totalStudents: uniqueStudents,
      totalAttempts: attempts.length,
      averageClassScore: parseFloat(averageClassScore),
      exams: examDetails
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 100) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('leaderboard')
        .select(`
          rank,
          student_id,
          average_marks,
          best_score,
          total_exams_taken,
          profiles(name, roll_no, branch)
        `)
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return [];
    }
  }

  /**
   * Get exam detailed report
   */
  async getExamReport(examId) {
    try {
      const client = await this.getClient();

      // Get exam details
      const { data: exam, error: examError } = await client
        .from('exams')
        .select('*')
        .eq('id', examId)
        .single();

      if (examError) throw examError;

      // Get all attempts
      const { data: attempts, error: attemptsError } = await client
        .from('exam_attempts')
        .select(`
          id,
          student_id,
          score,
          total_marks,
          percentage,
          time_taken_seconds,
          submitted_at,
          profiles(name, roll_no, branch)
        `)
        .eq('exam_id', examId)
        .eq('status', 'evaluated');

      if (attemptsError) throw attemptsError;

      // Get question analytics
      const { data: answers, error: answersError } = await client
        .from('exam_answers')
        .select(`
          question_id,
          is_correct,
          attempt_id,
          exam_questions(question_text)
        `)
        .in('attempt_id', attempts.map(a => a.id));

      if (answersError) throw answersError;

      // Calculate statistics
      const report = this.calculateExamReport(exam, attempts, answers);

      return report;
    } catch (error) {
      console.error('Get exam report error:', error);
      return null;
    }
  }

  /**
   * Calculate exam report
   */
  calculateExamReport(exam, attempts, answers) {
    if (!attempts || attempts.length === 0) {
      return {
        exam,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        highestScore: 0,
        lowestScore: 0,
        questionAnalysis: []
      };
    }

    const scores = attempts.map(a => a.score || 0);
    const percentages = attempts.map(a => a.percentage || 0);
    const passingThreshold = (exam.total_marks * 50) / 100; // 50% passing

    const questionStats = {};
    answers.forEach(answer => {
      if (!questionStats[answer.question_id]) {
        questionStats[answer.question_id] = {
          total: 0,
          correct: 0,
          question: answer.exam_questions?.question_text || 'Question'
        };
      }
      questionStats[answer.question_id].total++;
      if (answer.is_correct) {
        questionStats[answer.question_id].correct++;
      }
    });

    const questionAnalysis = Object.entries(questionStats).map(([qId, stats]) => ({
      questionId: qId,
      question: stats.question,
      totalAnswered: stats.total,
      correctAnswers: stats.correct,
      correctRate: ((stats.correct / stats.total) * 100).toFixed(2) + '%'
    }));

    const passedStudents = attempts.filter(a => (a.score || 0) >= passingThreshold).length;

    return {
      exam,
      totalAttempts: attempts.length,
      averageScore: (scores.reduce((a, b) => a + b, 0) / attempts.length).toFixed(2),
      averagePercentage: (percentages.reduce((a, b) => a + b, 0) / attempts.length).toFixed(2),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      passRate: ((passedStudents / attempts.length) * 100).toFixed(2) + '%',
      studentDetails: attempts,
      questionAnalysis
    };
  }

  /**
   * Track event (for future analytics)
   */
  async trackEvent(eventType, eventData) {
    try {
      // This would log to an events table for advanced analytics
      console.log('Event tracked:', eventType, eventData);
      return { success: true };
    } catch (error) {
      console.error('Track event error:', error);
      return { success: false };
    }
  }

  /**
   * Get performance trend
   */
  async getPerformanceTrend(studentId, limit = 10) {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('exam_attempts')
        .select('percentage, submitted_at, exams(subject)')
        .eq('student_id', studentId)
        .eq('status', 'evaluated')
        .order('submitted_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).reverse(); // Return in chronological order
    } catch (error) {
      console.error('Get performance trend error:', error);
      return [];
    }
  }

  /**
   * Get comparison metrics
   */
  async getComparisonMetrics(studentId) {
    try {
      // Get student's average
      const { stats } = await this.getStudentAnalytics(studentId);
      const studentAverage = stats.averagePercentage || 0;

      // Get class average
      const client = await this.getClient();
      const { data: allAttempts, error } = await client
        .from('exam_attempts')
        .select('percentage')
        .eq('status', 'evaluated');

      if (error) throw error;

      const classAverage = allAttempts && allAttempts.length > 0
        ? (allAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / allAttempts.length).toFixed(2)
        : 0;

      return {
        studentAverage: parseFloat(studentAverage),
        classAverage: parseFloat(classAverage),
        difference: (studentAverage - classAverage).toFixed(2),
        aboveAverage: studentAverage > classAverage
      };
    } catch (error) {
      console.error('Get comparison metrics error:', error);
      return {
        studentAverage: 0,
        classAverage: 0,
        difference: 0,
        aboveAverage: false
      };
    }
  }
}

// Export as singleton
const analyticsService = new AnalyticsService();

// For inline usage
if (typeof window !== 'undefined') {
  window.analyticsService = analyticsService;
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = analyticsService;
}
