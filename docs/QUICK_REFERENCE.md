# Phase 7 - Quick Reference Guide

## Page Flow Diagram

```
INDEX.HTML (Landing)
    ↓
STUDENT.HTML (Login/Signup)
    ↓
    ├─→ STUDENTHOME.HTML (Dashboard)
    │       ├─→ TESTHISTORY.HTML (View History)
    │       ├─→ GIVE TEST.HTML (Take Exam)
    │       │       ├─→ RESULT.HTML (View Result)
    │       │       └─→ TESTHISTORY.HTML
    │       ├─→ STUDENTACCOUNT.HTML (Edit Profile)
    │       └─→ STUDENT ASSINEMENT.HTML (View Assignments)
    │
    └─→ (Unauthorized) → Back to STUDENT.HTML
```

## Core Functions Reference

### Authentication (auth-service.js)

```javascript
// Signup
const result = await authService.signup(email, password, name, role);
if (result.success) {
  // User created
}

// Login
const result = await authService.login(email, password);
if (result.success) {
  // Session created
  localStorage.setItem('smartexam_studentName', result.user.user_metadata.name);
}

// Check Authentication
const isAuth = await authService.isAuthenticated();

// Get Current User
const user = await authService.getCurrentUser();

// Logout
const result = await authService.logout();

// Update Profile
const result = await authService.updateProfile(userId, {
  name: 'New Name',
  phone: '123-456-7890'
});

// Change Password
const result = await authService.updatePassword(newPassword);
```

### Exam Management (exam-service.js)

```javascript
// Get Available Exams
const exams = await examService.getAvailableExams();
// Returns: Array of exam objects

// Get Exam Details
const exam = await examService.getExamDetails(examId);
// Returns: {
//   id, title, description, subject, duration_minutes, total_marks,
//   questions: [{
//     id, question_text, option_a, option_b, option_c, option_d,
//     correct_answer, marks, explanation
//   }]
// }
```

### Result Management (result-service.js)

```javascript
// Start Exam Attempt
const result = await resultService.startAttempt(examId);
// Returns: { success, attempt: { id, student_id, exam_id, status, started_at } }

// Save Answer
const result = await resultService.saveAnswer(attemptId, questionId, selectedOption);
// selectedOption: 'A', 'B', 'C', or 'D'

// Submit Exam
const result = await resultService.submitExam(attemptId, timeTakenSeconds);
// Returns: { success, attempt, grading: { score, totalMarks, percentage } }

// Auto-Submit on Violation
const result = await resultService.autoSubmitExam(attemptId, reason);

// Get Result
const result = await resultService.getResult(attemptId);
// Returns: { attempt: {...}, answers: [{...}] }

// Get Student Attempts
const attempts = await resultService.getStudentAttempts(studentId);
// Returns: Array of attempts

// Get Attempt Answers
const answers = await resultService.getAttemptAnswers(attemptId);
```

### Assignment Management (assignment-service.js)

```javascript
// Get Assignments
const assignments = await assignmentService.getAssignments();

// Submit Assignment
const result = await assignmentService.submitAssignment(assignmentId, file);
// file: File object from input

// Get Student Submissions
const submissions = await assignmentService.getStudentSubmissions(studentId);

// Check if Submitted
const hasSubmitted = await assignmentService.hasStudentSubmitted(assignmentId, studentId);

// Check Overdue
const isOverdue = assignmentService.isAssignmentOverdue(dueDate);
```

### Utility Functions (exam-utils.js)

```javascript
// Loader
ExamUtils.showLoader('Loading...');
ExamUtils.hideLoader();

// Notifications
ExamUtils.showToast('Success!', 'success');  // Types: success, error, warning, info

// Confirmation
const confirmed = await ExamUtils.confirm(
  'Logout',
  'Are you sure?',
  'Yes',
  'Cancel'
);

// Formatting
ExamUtils.formatDuration(3661);        // "01:01:01"
ExamUtils.formatDate('2024-01-15');    // "January 15, 2024 02:30 PM"
ExamUtils.formatPercentage(85.5);      // "85.50%"

// Grading
ExamUtils.getGrade(92);               // "A+"
ExamUtils.getGradeColor(92);          // "#4caf50" (green)

// Utilities
ExamUtils.isValidEmail(email);
ExamUtils.getPasswordStrength(password);  // {score: 5, label: "Strong"}
```

### Anti-Cheat System (anticheat-system.js)

```javascript
// Initialize
await antiCheatSystem.initializeForExam(attemptId);

// End Exam
antiCheatSystem.endExam();

// Get Violations
const violations = antiCheatSystem.getViolations();

// Get Status
const status = antiCheatSystem.getStatusReport();
```

## Common Patterns

### On Page Load - Check Auth

```javascript
async function initPage() {
    ExamUtils.showLoader('Loading...');
    
    try {
        const isAuth = await authService.isAuthenticated();
        if (!isAuth) {
            ExamUtils.hideLoader();
            window.location.href = 'student.html';
            return;
        }
        
        // Your code here
        
        ExamUtils.hideLoader();
    } catch (error) {
        ExamUtils.hideLoader();
        ExamUtils.showToast('Error: ' + error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', initPage);
```

### Display Student Name

```javascript
const user = await authService.getCurrentUser();
const name = user?.user_metadata?.name || user?.email || 'Student';
document.querySelector('.welcome h1').textContent = `Welcome, ${name}!`;
```

### Form Submission

```javascript
document.getElementById('myForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    ExamUtils.showLoader('Processing...');
    
    try {
        const data = new FormData(e.target);
        // Process data
        ExamUtils.hideLoader();
        ExamUtils.showToast('Success!', 'success');
    } catch (error) {
        ExamUtils.hideLoader();
        ExamUtils.showToast('Error: ' + error.message, 'error');
    }
});
```

### Logout Handler

```javascript
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    const confirmed = await ExamUtils.confirm(
        'Logout',
        'Are you sure you want to logout?',
        'Yes',
        'Cancel'
    );
    if (confirmed) {
        ExamUtils.showLoader('Logging out...');
        const result = await authService.logout();
        ExamUtils.hideLoader();
        if (result.success) {
            window.location.href = 'student.html';
        }
    }
});
```

## URL Parameters

### Result Page
```
result.html?attemptId=uuid
```
Loads result for specific exam attempt.

## Data Models

### Exam Object
```javascript
{
  id: uuid,
  title: string,
  description: string,
  subject: string,
  duration_minutes: number,
  total_marks: number,
  status: 'draft' | 'scheduled' | 'active' | 'closed',
  start_time: timestamp,
  end_time: timestamp,
  instructions: string,
  teacher_id: uuid,
  questions: Question[]
}
```

### Question Object
```javascript
{
  id: uuid,
  question_text: string,
  option_a: string,
  option_b: string,
  option_c: string,
  option_d: string,
  correct_answer: 'A' | 'B' | 'C' | 'D',
  marks: number,
  explanation: string,
  question_order: number
}
```

### Attempt Object
```javascript
{
  id: uuid,
  student_id: uuid,
  exam_id: uuid,
  status: 'in_progress' | 'submitted' | 'evaluated',
  started_at: timestamp,
  submitted_at: timestamp,
  score: number,
  total_marks: number,
  percentage: number,
  time_taken_seconds: number
}
```

### Answer Object
```javascript
{
  id: uuid,
  attempt_id: uuid,
  question_id: uuid,
  selected_option: 'A' | 'B' | 'C' | 'D' | null,
  is_correct: boolean,
  marks_obtained: number,
  answered_at: timestamp
}
```

### Assignment Object
```javascript
{
  id: uuid,
  title: string,
  description: string,
  subject: string,
  due_date: timestamp,
  max_marks: number,
  attachment_url: string,
  status: 'open' | 'closed',
  teacher_id: uuid
}
```

## Common Errors & Solutions

### "authService is not defined"
**Solution**: Add `<script src="auth-service.js"></script>` before using

### "examService.getAvailableExams is not a function"
**Solution**: Add `<script src="exam-service.js"></script>` before using

### "Attempt failed - User not authenticated"
**Solution**: Check authentication with `authService.isAuthenticated()` before operations

### "Timer not updating"
**Solution**: Make sure `ExamUtils.formatDuration()` is called correctly with seconds

### "File upload failed"
**Solution**: Check file size (max 10MB) and ensure `assignment-service.js` is loaded

## Testing Checklist

- [ ] Signup creates user and redirects to dashboard
- [ ] Login authenticates and loads exams
- [ ] Dashboard displays student name correctly
- [ ] Exam list loads from database
- [ ] Timer counts down correctly
- [ ] Answers save automatically
- [ ] Anti-cheat monitoring works
- [ ] Exam submission triggers grading
- [ ] Result page displays correctly
- [ ] History shows all attempts
- [ ] Profile updates save to database
- [ ] Logout clears session
- [ ] Assignments load from database
- [ ] File upload works correctly
- [ ] All error messages display correctly

## Performance Tips

1. **Minimize API Calls**: Cache user and exam data when possible
2. **Debounce Saves**: Save answers every 5 seconds, not on every keystroke
3. **Lazy Load**: Load images and content as needed
4. **Compress Files**: Optimize images before upload
5. **Use Pagination**: For large lists, paginate results
6. **Monitor Performance**: Check network tab for slow requests

## Security Considerations

1. **Always Check Auth**: Verify authentication before sensitive operations
2. **Validate Input**: Check user input before sending to database
3. **Use HTTPS**: Always use HTTPS in production
4. **Store Tokens Safely**: Don't log tokens in console
5. **Validate Files**: Check file type and size before upload
6. **Use Rate Limiting**: Prevent abuse with request limits
7. **Sanitize Output**: Escape HTML in user-provided content

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

## Deployment Steps

1. Configure Supabase project
2. Create database tables from schema.sql
3. Set API keys in auth-service.js
4. Create storage bucket for assignments
5. Test authentication flow
6. Test exam taking flow
7. Test result display
8. Deploy to production
9. Monitor error logs

## Support & Debugging

### Enable Debug Mode
```javascript
// Add this to any page to see debug info
localStorage.setItem('debug_mode', 'true');
```

### Check Network Requests
Open DevTools → Network tab to see all API calls

### Check Browser Console
Open DevTools → Console to see error messages

### Check Supabase Logs
Go to Supabase dashboard → Logs to see database errors

## Additional Resources

- Supabase Docs: https://supabase.com/docs
- JavaScript Async/Await: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous
- Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- Local Storage: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

---

**Last Updated**: Phase 7 Completion
**Version**: 1.0
**Status**: Production Ready
