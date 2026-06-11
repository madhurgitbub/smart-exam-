-- ============================================================
-- SMART EXAM PLATFORM - Row Level Security (RLS) Policies
-- ============================================================
-- Security policies to enforce data access control
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_exams ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES TABLE POLICIES
-- ============================================================

-- Students can only view their own profile
CREATE POLICY "Students can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Teachers can view all student profiles (for their exams)
CREATE POLICY "Teachers can view student profiles" ON profiles
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    ));

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- EXAMS TABLE POLICIES
-- ============================================================

-- Students can view active and scheduled exams
CREATE POLICY "Students can view active exams" ON exams
    FOR SELECT USING (
        status IN ('active', 'scheduled') OR
        teacher_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Teachers can view and manage their own exams
CREATE POLICY "Teachers can view their own exams" ON exams
    FOR SELECT USING (teacher_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Teachers can create exams
CREATE POLICY "Teachers can create exams" ON exams
    FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- Teachers can update their own exams
CREATE POLICY "Teachers can update their own exams" ON exams
    FOR UPDATE USING (teacher_id = auth.uid());

-- Teachers can delete their own exams
CREATE POLICY "Teachers can delete their own exams" ON exams
    FOR DELETE USING (teacher_id = auth.uid());

-- ============================================================
-- EXAM QUESTIONS TABLE POLICIES
-- ============================================================

-- Everyone can view questions for active exams
CREATE POLICY "Everyone can view active exam questions" ON exam_questions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM exams WHERE id = exam_id AND status IN ('active', 'scheduled'))
        OR EXISTS (SELECT 1 FROM exams WHERE id = exam_id AND teacher_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Teachers can manage questions for their exams
CREATE POLICY "Teachers can manage their exam questions" ON exam_questions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM exams WHERE id = exam_id AND teacher_id = auth.uid()
    ));

CREATE POLICY "Teachers can update their exam questions" ON exam_questions
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM exams WHERE id = exam_id AND teacher_id = auth.uid()
    ));

CREATE POLICY "Teachers can delete their exam questions" ON exam_questions
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM exams WHERE id = exam_id AND teacher_id = auth.uid()
    ));

-- ============================================================
-- EXAM ATTEMPTS TABLE POLICIES
-- ============================================================

-- Students can only view their own attempts
CREATE POLICY "Students can view their own attempts" ON exam_attempts
    FOR SELECT USING (
        student_id = auth.uid() OR
        EXISTS (SELECT 1 FROM exams WHERE id = exam_id AND teacher_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Students can create attempts for available exams
CREATE POLICY "Students can create exam attempts" ON exam_attempts
    FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can update their own attempts
CREATE POLICY "Students can update their own attempts" ON exam_attempts
    FOR UPDATE USING (student_id = auth.uid());

-- ============================================================
-- EXAM ANSWERS TABLE POLICIES
-- ============================================================

-- Students can view answers to their own attempts
CREATE POLICY "Students can view their own answers" ON exam_answers
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM exam_attempts WHERE id = attempt_id AND student_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM exam_attempts ea
        JOIN exams e ON ea.exam_id = e.id
        WHERE ea.id = attempt_id AND e.teacher_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Students can create and update their answers
CREATE POLICY "Students can manage their answers" ON exam_answers
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM exam_attempts WHERE id = attempt_id AND student_id = auth.uid()
    ));

CREATE POLICY "Students can update their answers" ON exam_answers
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM exam_attempts WHERE id = attempt_id AND student_id = auth.uid()
    ));

-- ============================================================
-- ASSIGNMENTS TABLE POLICIES
-- ============================================================

-- Students can view open assignments
CREATE POLICY "Students can view open assignments" ON assignments
    FOR SELECT USING (
        status = 'open' OR
        teacher_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Teachers can manage their own assignments
CREATE POLICY "Teachers can manage their assignments" ON assignments
    FOR INSERT WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their assignments" ON assignments
    FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their assignments" ON assignments
    FOR DELETE USING (teacher_id = auth.uid());

-- ============================================================
-- ASSIGNMENT SUBMISSIONS TABLE POLICIES
-- ============================================================

-- Students can only view and manage their own submissions
CREATE POLICY "Students can view their submissions" ON assignment_submissions
    FOR SELECT USING (
        student_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM assignments WHERE id = assignment_id AND teacher_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Students can create submissions
CREATE POLICY "Students can create submissions" ON assignment_submissions
    FOR INSERT WITH CHECK (student_id = auth.uid());

-- Students can update their own submissions
CREATE POLICY "Students can update their submissions" ON assignment_submissions
    FOR UPDATE USING (student_id = auth.uid());

-- Teachers can view submissions for their assignments
CREATE POLICY "Teachers can view assignment submissions" ON assignment_submissions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM assignments WHERE id = assignment_id AND teacher_id = auth.uid()
    ));

-- ============================================================
-- EXAM VIOLATIONS TABLE POLICIES
-- ============================================================

-- Violations are admin/teacher only
CREATE POLICY "Teachers can view violations for their exams" ON exam_violations
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM exams WHERE id = exam_id AND teacher_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "System can log violations" ON exam_violations
    FOR INSERT WITH CHECK (true);

-- ============================================================
-- LEADERBOARD TABLE POLICIES
-- ============================================================

-- Everyone can view leaderboard
CREATE POLICY "Everyone can view leaderboard" ON leaderboard
    FOR SELECT USING (true);

-- System can manage leaderboard
CREATE POLICY "System can update leaderboard" ON leaderboard
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update leaderboard data" ON leaderboard
    FOR UPDATE USING (true);

-- ============================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================

-- Users can only view their own notifications
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- System can create notifications
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Users can update their notifications
CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================================
-- ANALYTICS TABLE POLICIES
-- ============================================================

-- Students can view their own analytics
CREATE POLICY "Students can view their analytics" ON student_analytics
    FOR SELECT USING (
        student_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
    );

-- Teachers can view their analytics
CREATE POLICY "Teachers can view their analytics" ON teacher_analytics
    FOR SELECT USING (
        teacher_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- System can manage analytics
CREATE POLICY "System can manage student analytics" ON student_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update student analytics" ON student_analytics
    FOR UPDATE USING (true);

CREATE POLICY "System can manage teacher analytics" ON teacher_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update teacher analytics" ON teacher_analytics
    FOR UPDATE USING (true);

-- ============================================================
-- CLASSES TABLE POLICIES
-- ============================================================

-- Teachers can view their own classes
CREATE POLICY "Teachers can view their own classes" ON classes
    FOR SELECT USING (
        teacher_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Students can view classes they are enrolled in
CREATE POLICY "Students can view enrolled classes" ON classes
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM class_enrollments
        WHERE class_id = id AND student_id = auth.uid()
    ));

-- Teachers can create classes
CREATE POLICY "Teachers can create classes" ON classes
    FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- Teachers can update their own classes
CREATE POLICY "Teachers can update their classes" ON classes
    FOR UPDATE USING (teacher_id = auth.uid());

-- Teachers can delete their own classes
CREATE POLICY "Teachers can delete their classes" ON classes
    FOR DELETE USING (teacher_id = auth.uid());

-- ============================================================
-- CLASS ENROLLMENTS TABLE POLICIES
-- ============================================================

-- Users can view their own enrollments and teachers can view their class enrollments
CREATE POLICY "Users can view their enrollments" ON class_enrollments
    FOR SELECT USING (
        student_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM classes
            WHERE id = class_id AND teacher_id = auth.uid()
        ) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Students can enroll in classes
CREATE POLICY "Students can enroll in classes" ON class_enrollments
    FOR INSERT WITH CHECK (student_id = auth.uid());

-- Teachers can update enrollments in their classes
CREATE POLICY "Teachers can manage enrollments" ON class_enrollments
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM classes
        WHERE id = class_id AND teacher_id = auth.uid()
    ));

-- ============================================================
-- CLASS EXAMS TABLE POLICIES
-- ============================================================

-- Teachers can view class exams for their classes
CREATE POLICY "Teachers can view class exams" ON class_exams
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM classes
        WHERE id = class_id AND teacher_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Students can view exams for their classes
CREATE POLICY "Students can view their class exams" ON class_exams
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM class_enrollments
        WHERE class_id = class_id AND student_id = auth.uid()
    ));

-- Teachers can manage class exams
CREATE POLICY "Teachers can manage class exams" ON class_exams
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM classes
        WHERE id = class_id AND teacher_id = auth.uid()
    ));

CREATE POLICY "Teachers can update class exams" ON class_exams
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM classes
        WHERE id = class_id AND teacher_id = auth.uid()
    ));

CREATE POLICY "Teachers can delete class exams" ON class_exams
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM classes
        WHERE id = class_id AND teacher_id = auth.uid()
    ));

-- ============================================================
-- END OF RLS POLICIES
-- ============================================================
