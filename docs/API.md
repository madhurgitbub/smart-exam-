# Smart Exam Platform - API Documentation

## Overview

Smart Exam Platform provides a complete set of JavaScript services for exam management, authentication, analytics, and more. All services are available globally through the `window` object.

---

## Table of Contents

1. [Authentication Service](#authentication-service)
2. [Exam Service](#exam-service)
3. [Result Service](#result-service)
4. [Assignment Service](#assignment-service)
5. [Analytics Service](#analytics-service)
6. [Anti-Cheat System](#anti-cheat-system)
7. [Utility Functions](#utility-functions)

---

## Authentication Service

### Overview
Handles user authentication, registration, password management, and profile operations.

### Methods

#### `signup(email, password, name, role)`
Create new user account.

```javascript
const result = await authService.signup(
  'student@example.com',
  'SecurePassword123!',
  'John Doe',
  'student' // 'student', 'teacher', or 'admin'
);

// Returns: { success: true, user: {...}, message: '...' }
// Or: { success: false, error: 'Email already exists' }
```

#### `login(email, password)`
User login with email and password.

```javascript
const result = await authService.login(
  'student@example.com',
  'SecurePassword123!'
);

// Returns: { success: true, user: {...}, session: {...} }
// Or: { success: false, error: 'Invalid credentials' }
```

#### `logout()`
End user session.

```javascript
const result = await authService.logout();
// Returns: { success: true }
```

#### `getCurrentUser()`
Get currently logged-in user.

```javascript
const user = await authService.getCurrentUser();
// Returns: { id, email, profile: {...} }
// Returns: null if not authenticated
```

#### `getUserRole()`
Get current user's role.

```javascript
const role = await authService.getUserRole();
// Returns: 'student', 'teacher', 'admin', or null
```

#### `updateProfile(userId, profileData)`
Update user profile information.

```javascript
const result = await authService.updateProfile(userId, {
  name: 'Jane Doe',
  branch: 'Computer Science',
  semester: 4
});

// Returns: { success: true, message: '...' }
```

#### `resetPassword(email)`
Send password reset email.

```javascript
const result = await authService.resetPassword('student@example.com');
// Returns: { success: true, message: '...' }
```

#### `updatePassword(newPassword)`
Update user password.

```javascript
const result = await authService.updatePassword('NewPassword123!');
// Returns: { success: true, message: '...' }
```

#### `isAuthenticated()`
Check if user is logged in.

```javascript
const isLoggedIn = await authService.isAuthenticated();
// Returns: true or false
```

---

## Exam Service

### Overview
Handles exam creation, management, questions, and retrieval.

### Methods

#### `getAvailableExams()`
Get all exams available for student.

```javascript
const exams = await examService.getAvailableExams();
// Returns: Array of active and scheduled exams
```

#### `getExamDetails(examId)`
Get complete exam with all questions.

```javascript
const exam = await examService.getExamDetails('exam-uuid');
// Returns: { id, title, questions: [...], ... }
```

#### `createExam(examData)`
Create new exam (teacher only).

```javascript
const result = await examService.createExam({
  title: 'Mathematics Final Exam',
  description: 'Final assessment for semester 4',
  subject: 'Mathematics',
  duration_minutes: 60,
  total_marks: 100,
  start_time: '2026-06-01T10:00:00Z',
  end_time: '2026-06-01T11:00:00Z',
  instructions: 'Answer all questions...'
});

// Returns: { success: true, exam: {...} }
```

#### `updateExam(examId, examData)`
Update existing exam.

```javascript
const result = await examService.updateExam(examId, {
  title: 'Updated Title',
  duration_minutes: 90
});

// Returns: { success: true, exam: {...} }
```

#### `deleteExam(examId)`
Delete an exam.

```javascript
const result = await examService.deleteExam(examId);
// Returns: { success: true, message: '...' }
```

#### `publishExam(examId)`
Publish exam from draft to scheduled.

```javascript
const result = await examService.publishExam(examId);
// Returns: { success: true, exam: {...} }
```

#### `addQuestion(examId, questionData)`
Add MCQ question to exam.

```javascript
const result = await examService.addQuestion(examId, {
  question_text: 'What is 2+2?',
  option_a: '3',
  option_b: '4',
  option_c: '5',
  option_d: '6',
  correct_answer: 'B',
  marks: 1.0,
  question_order: 1
});

// Returns: { success: true, question: {...} }
```

#### `updateQuestion(questionId, questionData)`
Update question.

```javascript
const result = await examService.updateQuestion(questionId, {
  question_text: 'Updated question?'
});

// Returns: { success: true, question: {...} }
```

#### `deleteQuestion(questionId)`
Delete question.

```javascript
const result = await examService.deleteQuestion(questionId);
// Returns: { success: true, message: '...' }
```

#### `getTeacherExams(teacherId)`
Get all exams created by teacher.

```javascript
const exams = await examService.getTeacherExams(teacherId);
// Returns: Array of exams
```

#### `canAttemptExam(examId, studentId)`
Check if student can attempt exam.

```javascript
const canAttempt = await examService.canAttemptExam(examId, studentId);
// Returns: true or false
```

---

## Result Service

### Overview
Handles exam attempts, grading, result generation, and scoring.

### Methods

#### `startAttempt(examId)`
Start new exam attempt.

```javascript
const result = await resultService.startAttempt(examId);
// Returns: { success: true, attempt: {...} }
```

#### `saveAnswer(attemptId, questionId, selectedOption)`
Save student's answer.

```javascript
const result = await resultService.saveAnswer(
  attemptId,
  questionId,
  'B' // A, B, C, or D
);

// Returns: { success: true, answer: {...} }
```

#### `submitExam(attemptId, timeTakenSeconds)`
Submit completed exam.

```javascript
const result = await resultService.submitExam(attemptId, 3600);
// Returns: { success: true, attempt: {...}, grading: {...} }
```

#### `autoSubmitExam(attemptId, reason)`
Auto-submit exam (anti-cheat violation).

```javascript
const result = await resultService.autoSubmitExam(
  attemptId,
  'Tab switch detected'
);

// Returns: { success: true, attempt: {...} }
```

#### `getResult(attemptId)`
Get exam result with detailed answers.

```javascript
const result = await resultService.getResult(attemptId);
// Returns: { attempt: {...}, answers: [...] }
```

#### `getStudentAttempts(studentId)`
Get all exam attempts by student.

```javascript
const attempts = await resultService.getStudentAttempts(studentId);
// Returns: Array of attempts with exam details
```

#### `gradeExam(attemptId)`
Grade exam (automatic calculation).

```javascript
const result = await resultService.gradeExam(attemptId);
// Returns: { success: true, score, totalMarks, percentage }
```

#### `logViolation(studentId, examId, attemptId, type, description)`
Log anti-cheat violation.

```javascript
const result = await resultService.logViolation(
  studentId,
  examId,
  attemptId,
  'TAB_SWITCH',
  'Student switched tabs'
);

// Returns: { success: true }
```

#### `updateLeaderboard(studentId)`
Update student's leaderboard position.

```javascript
const result = await resultService.updateLeaderboard(studentId);
// Returns: { success: true }
```

#### `updateStudentAnalytics(studentId)`
Update student's analytics.

```javascript
const result = await resultService.updateStudentAnalytics(studentId);
// Returns: { success: true }
```

---

## Assignment Service

### Overview
Handles assignment creation, submission, grading, and file management.

### Methods

#### `getAssignments()`
Get all available assignments for student.

```javascript
const assignments = await assignmentService.getAssignments();
// Returns: Array of open assignments
```

#### `getTeacherAssignments(teacherId)`
Get teacher's assignments.

```javascript
const assignments = await assignmentService.getTeacherAssignments(teacherId);
// Returns: Array of assignments created by teacher
```

#### `createAssignment(assignmentData)`
Create new assignment.

```javascript
const result = await assignmentService.createAssignment({
  title: 'Math Assignment 1',
  description: 'Solve problems 1-10',
  subject: 'Mathematics',
  due_date: '2026-06-15T23:59:59Z',
  max_marks: 10
});

// Returns: { success: true, assignment: {...} }
```

#### `updateAssignment(assignmentId, assignmentData)`
Update assignment.

```javascript
const result = await assignmentService.updateAssignment(assignmentId, {
  title: 'Updated Title',
  due_date: '2026-06-20T23:59:59Z'
});

// Returns: { success: true, assignment: {...} }
```

#### `deleteAssignment(assignmentId)`
Delete assignment.

```javascript
const result = await assignmentService.deleteAssignment(assignmentId);
// Returns: { success: true, message: '...' }
```

#### `uploadFile(file, path)`
Upload file to storage.

```javascript
const result = await assignmentService.uploadFile(fileObject, 'path');
// Returns: { success: true, url, filename, path }
```

#### `submitAssignment(assignmentId, file)`
Submit assignment file.

```javascript
const result = await assignmentService.submitAssignment(assignmentId, fileObject);
// Returns: { success: true, submission: {...} }
```

#### `getSubmissions(assignmentId)`
Get all submissions for assignment.

```javascript
const submissions = await assignmentService.getSubmissions(assignmentId);
// Returns: Array of submissions
```

#### `gradeSubmission(submissionId, marksObtained, feedback)`
Grade submission.

```javascript
const result = await assignmentService.gradeSubmission(
  submissionId,
  8,
  'Good work!'
);

// Returns: { success: true, submission: {...} }
```

#### `getStudentSubmissions(studentId)`
Get student's submissions.

```javascript
const submissions = await assignmentService.getStudentSubmissions(studentId);
// Returns: Array of student submissions
```

#### `hasStudentSubmitted(assignmentId, studentId)`
Check if student submitted.

```javascript
const hasSubmitted = await assignmentService.hasStudentSubmitted(
  assignmentId,
  studentId
);

// Returns: true or false
```

#### `isAssignmentOverdue(dueDate)`
Check if assignment deadline passed.

```javascript
const isOverdue = assignmentService.isAssignmentOverdue(dueDate);
// Returns: true or false
```

---

## Analytics Service

### Overview
Provides analytics, reports, and performance metrics.

### Methods

#### `getStudentAnalytics(studentId)`
Get student's performance analytics.

```javascript
const analytics = await analyticsService.getStudentAnalytics(studentId);
// Returns: { stats: {...}, attempts: [...], rank, averageMarks, bestScore }
```

#### `getTeacherAnalytics(teacherId)`
Get teacher's statistics.

```javascript
const analytics = await analyticsService.getTeacherAnalytics(teacherId);
// Returns: { totalExams, totalStudents, averageClassScore, exams: [...] }
```

#### `getLeaderboard(limit)`
Get global leaderboard.

```javascript
const leaderboard = await analyticsService.getLeaderboard(100);
// Returns: Array of students ranked
```

#### `getExamReport(examId)`
Get detailed exam report.

```javascript
const report = await analyticsService.getExamReport(examId);
// Returns: { exam, totalAttempts, averageScore, questionAnalysis: [...] }
```

#### `getPerformanceTrend(studentId, limit)`
Get student's performance trend.

```javascript
const trend = await analyticsService.getPerformanceTrend(studentId, 10);
// Returns: Array of attempts in chronological order
```

#### `getComparisonMetrics(studentId)`
Compare student's performance to class.

```javascript
const comparison = await analyticsService.getComparisonMetrics(studentId);
// Returns: { studentAverage, classAverage, difference, aboveAverage }
```

---

## Anti-Cheat System

### Overview
Monitors exam security and prevents cheating.

### Methods

#### `initializeForExam(attemptId)`
Start anti-cheat monitoring.

```javascript
antiCheatSystem.initializeForExam(attemptId);
// Starts all security measures
```

#### `getViolations()`
Get all violations logged.

```javascript
const violations = antiCheatSystem.getViolations();
// Returns: Array of violations
```

#### `endExam()`
Stop monitoring and cleanup.

```javascript
antiCheatSystem.endExam();
// Cleans up event listeners, exits fullscreen
```

#### `getStatusReport()`
Get current exam status.

```javascript
const report = antiCheatSystem.getStatusReport();
// Returns: { isActive, tabSwitches, windowBlurs, violations: [...] }
```

---

## Utility Functions

### Overview
Common helper functions.

### Methods

#### `formatDuration(seconds)`
Format seconds to HH:MM:SS.

```javascript
ExamUtils.formatDuration(3661);
// Returns: '01:01:01'
```

#### `formatDate(dateString)`
Format date to readable string.

```javascript
ExamUtils.formatDate('2026-06-01T10:00:00Z');
// Returns: 'June 1, 2026, 10:00 AM'
```

#### `formatPercentage(value, decimals)`
Format value as percentage.

```javascript
ExamUtils.formatPercentage(85.5, 2);
// Returns: '85.50%'
```

#### `isValidEmail(email)`
Validate email format.

```javascript
ExamUtils.isValidEmail('user@example.com');
// Returns: true
```

#### `getPasswordStrength(password)`
Check password strength.

```javascript
const strength = ExamUtils.getPasswordStrength('SecurePass123!');
// Returns: { score: 6, label: 'Very Strong' }
```

#### `getGrade(percentage)`
Get letter grade from percentage.

```javascript
ExamUtils.getGrade(85);
// Returns: 'A'
```

#### `generateUUID()`
Generate unique ID.

```javascript
const id = ExamUtils.generateUUID();
// Returns: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
```

#### `showLoader(message)`
Show loading spinner.

```javascript
const loader = ExamUtils.showLoader('Loading...');
// Creates animated loading overlay
```

#### `hideLoader()`
Hide loading spinner.

```javascript
ExamUtils.hideLoader();
// Removes loading overlay
```

#### `showToast(message, type, duration)`
Show notification toast.

```javascript
ExamUtils.showToast('Exam submitted!', 'success', 4000);
// Types: 'success', 'error', 'warning', 'info'
```

#### `confirm(title, message, okText, cancelText)`
Show confirmation dialog.

```javascript
const confirmed = await ExamUtils.confirm(
  'Submit Exam?',
  'You cannot change answers after submission.',
  'Submit',
  'Cancel'
);
// Returns: true or false
```

#### `debounce(func, wait)`
Debounce function execution.

```javascript
const saveAnswer = ExamUtils.debounce(function(answer) {
  resultService.saveAnswer(attemptId, questionId, answer);
}, 1000);

// Function calls within 1 second are debounced
```

#### `throttle(func, limit)`
Throttle function execution.

```javascript
const saveProgress = ExamUtils.throttle(function() {
  // Auto-save
}, 5000);

// Function executes max once per 5 seconds
```

#### `exportToCSV(data, filename)`
Export data as CSV file.

```javascript
ExamUtils.exportToCSV(leaderboardData, 'leaderboard.csv');
// Downloads CSV file
```

#### `getBrowserInfo()`
Get browser information.

```javascript
const info = ExamUtils.getBrowserInfo();
// Returns: { browser, version, os, isMobile, ... }
```

---

## Error Handling

All services follow consistent error handling:

```javascript
const result = await service.someMethod();

if (result.success) {
  // Handle success
  console.log(result.data);
} else {
  // Handle error
  ExamUtils.showToast(result.error, 'error');
}
```

---

## Complete Example: Taking an Exam

```javascript
// 1. Login
const loginResult = await authService.login(email, password);
if (!loginResult.success) return;

// 2. Get available exams
const exams = await examService.getAvailableExams();

// 3. Start exam
const attemptResult = await resultService.startAttempt(examId);
const attemptId = attemptResult.attempt.id;

// 4. Initialize anti-cheat
antiCheatSystem.initializeForExam(attemptId);

// 5. Get exam with questions
const exam = await examService.getExamDetails(examId);

// 6. Student answers questions and we save
for (const question of exam.questions) {
  const selectedOption = getStudentAnswer(question.id);
  await resultService.saveAnswer(attemptId, question.id, selectedOption);
}

// 7. Submit exam
const timeTaken = calculateTimeTaken();
const submitResult = await resultService.submitExam(attemptId, timeTaken);

// 8. Show result
const result = await resultService.getResult(attemptId);
displayResult(result);

// 9. Stop anti-cheat
antiCheatSystem.endExam();
```

---

## Rate Limiting

Some operations are rate-limited:
- Login attempts: 5 per 15 minutes
- Password reset: 1 per hour
- API calls: 1000 per minute (Supabase limit)

---

## Supabase Requirements

All services require:
- Valid Supabase project credentials
- `VITE_SUPABASE_URL` environment variable
- `VITE_SUPABASE_ANON_KEY` environment variable
- RLS policies enabled
- Tables created from schema.sql

---

## Support

For issues or questions:
- Check browser console for errors
- Verify Supabase connection
- Review network requests in DevTools
- Check Supabase logs
- Email: support@smartexam.com

---

**Last Updated**: 2026-05-22  
**API Version**: 1.0.0
