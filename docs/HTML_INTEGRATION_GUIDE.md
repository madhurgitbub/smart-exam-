# Smart Exam Platform - HTML Integration Guide

## Overview

This guide shows how to integrate the existing HTML pages with the Smart Exam Platform services to create a fully functional application.

## File Organization

Your existing HTML files should be organized as follows:

```
frontend/public/
├── index.html                   # Landing page
├── help.html                    # Help/FAQ page
├── student/
│   ├── studenthome.html        # Student dashboard
│   ├── student.html            # Student login/signup
│   ├── studentaccount.html     # Student profile
│   ├── studentassignment.html  # Student assignments view
│   ├── give-test.html          # Take exam page
│   ├── result.html             # View results
│   ├── results.html            # Results history
│   └── testhistory.html        # Exam history
├── teacher/
│   ├── teacherhome.html        # Teacher dashboard
│   ├── teacher.html            # Teacher login/signup
│   ├── teacheraccount.html     # Teacher profile
│   └── teacherassignment.html  # Teacher create/manage assignments
└── common/
    └── leaderboard.html        # Global leaderboard
```

## Required Script Includes

Add these scripts to the `<head>` section of EVERY HTML page:

```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.0/dist/module.min.js"></script>

<!-- Smart Exam Services -->
<script src="../auth-service.js"></script>
<script src="../exam-service.js"></script>
<script src="../result-service.js"></script>
<script src="../assignment-service.js"></script>
<script src="../analytics-service.js"></script>
<script src="../anticheat-system.js"></script>
<script src="../exam-utils.js"></script>

<!-- Chart.js for analytics -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>

<!-- jsPDF for reports -->
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
```

**Note**: Adjust paths based on directory nesting (use `../../` if needed).

---

## Page-by-Page Integration

### 1. index.html (Landing Page)

**Purpose**: Welcome page with role selection

```html
<script>
  // Check if user is already logged in
  window.addEventListener('DOMContentLoaded', async () => {
    const isAuth = await authService.isAuthenticated();
    
    if (isAuth) {
      const role = await authService.getUserRole();
      
      if (role === 'student') {
        window.location.href = 'student/studenthome.html';
      } else if (role === 'teacher') {
        window.location.href = 'teacher/teacherhome.html';
      } else if (role === 'admin') {
        window.location.href = 'admin/adminhome.html';
      }
    }
  });
  
  // Update login buttons to actual pages
  // Change href from "student.html" to "student/student.html"
  // Change href from "teacher.html" to "teacher/teacher.html"
</script>
```

### 2. student/student.html (Student Login/Signup)

**Purpose**: Student authentication page

```html
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    // Check if already logged in
    if (await authService.isAuthenticated()) {
      window.location.href = 'studenthome.html';
    }
  });

  // Add form handlers
  const signupForm = document.getElementById('signupForm'); // Update with actual form ID
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      ExamUtils.showLoader('Creating account...');
      
      const email = signupForm.querySelector('[name="email"]').value;
      const password = signupForm.querySelector('[name="password"]').value;
      const name = signupForm.querySelector('[name="name"]').value;
      
      const result = await authService.signup(email, password, name, 'student');
      
      ExamUtils.hideLoader();
      
      if (result.success) {
        ExamUtils.showToast('Signup successful! Check your email.', 'success');
        setTimeout(() => {
          window.location.href = 'studenthome.html';
        }, 2000);
      } else {
        ExamUtils.showToast(result.error, 'error');
      }
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      ExamUtils.showLoader('Logging in...');
      
      const email = loginForm.querySelector('[name="email"]').value;
      const password = loginForm.querySelector('[name="password"]').value;
      
      const result = await authService.login(email, password);
      
      ExamUtils.hideLoader();
      
      if (result.success) {
        ExamUtils.showToast('Login successful!', 'success');
        setTimeout(() => {
          window.location.href = 'studenthome.html';
        }, 500);
      } else {
        ExamUtils.showToast(result.error, 'error');
      }
    });
  }
</script>
```

### 3. student/studenthome.html (Student Dashboard)

**Purpose**: Student main dashboard with available exams

```html
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const user = await authService.getCurrentUser();
    if (!user) {
      window.location.href = 'student.html';
      return;
    }

    // Display student name
    const nameElement = document.querySelector('[data-student-name]');
    if (nameElement) {
      nameElement.textContent = user.profile?.name || 'Student';
    }

    // Load and display exams
    await loadExams();

    // Setup logout button
    const logoutBtn = document.querySelector('[data-logout]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await authService.logout();
        window.location.href = '../index.html';
      });
    }
  });

  async function loadExams() {
    ExamUtils.showLoader('Loading exams...');
    
    const exams = await examService.getAvailableExams();
    
    ExamUtils.hideLoader();

    const examsContainer = document.querySelector('[data-exams-container]');
    if (!examsContainer) return;

    if (exams.length === 0) {
      examsContainer.innerHTML = '<p>No exams available</p>';
      return;
    }

    examsContainer.innerHTML = exams.map(exam => `
      <div class="exam-card">
        <h3>${exam.title}</h3>
        <p>${exam.description || ''}</p>
        <p>Duration: ${exam.duration_minutes} minutes | Marks: ${exam.total_marks}</p>
        <button onclick="takeExam('${exam.id}')">Take Exam</button>
      </div>
    `).join('');
  }

  async function takeExam(examId) {
    window.location.href = `give-test.html?examId=${examId}`;
  }
</script>
```

### 4. student/give-test.html (Take Exam Page)

**Purpose**: MCQ exam interface with timer and questions

```html
<script>
  let currentExam = null;
  let currentAttempt = null;
  let startTime = null;
  const questions = [];
  let currentQuestionIndex = 0;

  document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const user = await authService.getCurrentUser();
    if (!user) {
      window.location.href = 'student.html';
      return;
    }

    // Get exam ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('examId');

    if (!examId) {
      ExamUtils.showToast('No exam selected', 'error');
      window.location.href = 'studenthome.html';
      return;
    }

    await loadExam(examId);
    await startExamAttempt(examId);
    displayQuestion();
    startTimer();
  });

  async function loadExam(examId) {
    ExamUtils.showLoader('Loading exam...');
    
    currentExam = await examService.getExamDetails(examId);
    
    ExamUtils.hideLoader();

    if (!currentExam) {
      ExamUtils.showToast('Failed to load exam', 'error');
      window.location.href = 'studenthome.html';
    }

    // Update exam title
    document.querySelector('[data-exam-title]').textContent = currentExam.title;
    document.querySelector('[data-total-questions]').textContent = currentExam.questions.length;
  }

  async function startExamAttempt(examId) {
    const result = await resultService.startAttempt(examId);
    
    if (result.success) {
      currentAttempt = result.attempt;
      startTime = new Date();
      
      // Initialize anti-cheat
      antiCheatSystem.initializeForExam(currentAttempt.id);
    } else {
      ExamUtils.showToast('Failed to start exam', 'error');
      window.location.href = 'studenthome.html';
    }
  }

  function displayQuestion() {
    if (!currentExam || currentQuestionIndex >= currentExam.questions.length) {
      return;
    }

    const question = currentExam.questions[currentQuestionIndex];
    
    // Update question display (implement based on your HTML structure)
    document.querySelector('[data-question-text]').innerHTML = 
      `<strong>Q${currentQuestionIndex + 1}:</strong> ${question.question_text}`;

    const optionsContainer = document.querySelector('[data-options-container]');
    optionsContainer.innerHTML = `
      <label>
        <input type="radio" name="answer" value="A" onchange="saveAnswer('${question.id}', 'A')">
        ${question.option_a}
      </label>
      <label>
        <input type="radio" name="answer" value="B" onchange="saveAnswer('${question.id}', 'B')">
        ${question.option_b}
      </label>
      <label>
        <input type="radio" name="answer" value="C" onchange="saveAnswer('${question.id}', 'C')">
        ${question.option_c}
      </label>
      <label>
        <input type="radio" name="answer" value="D" onchange="saveAnswer('${question.id}', 'D')">
        ${question.option_d}
      </label>
    `;

    // Update progress
    document.querySelector('[data-current-question]').textContent = 
      currentQuestionIndex + 1;
  }

  async function saveAnswer(questionId, selectedOption) {
    const result = await resultService.saveAnswer(
      currentAttempt.id,
      questionId,
      selectedOption
    );

    if (!result.success) {
      ExamUtils.showToast('Failed to save answer', 'error');
    }
  }

  function startTimer() {
    const durationSeconds = currentExam.duration_minutes * 60;
    let remainingSeconds = durationSeconds;

    const timerInterval = setInterval(() => {
      remainingSeconds--;

      const formatted = ExamUtils.formatDuration(remainingSeconds);
      document.querySelector('[data-timer]').textContent = formatted;

      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        submitExam();
      }
    }, 1000);
  }

  async function nextQuestion() {
    if (currentQuestionIndex < currentExam.questions.length - 1) {
      currentQuestionIndex++;
      displayQuestion();
    }
  }

  function previousQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      displayQuestion();
    }
  }

  async function submitExam() {
    if (!await ExamUtils.confirm(
      'Submit Exam?',
      'You cannot change answers after submission.',
      'Submit',
      'Continue Exam'
    )) {
      return;
    }

    ExamUtils.showLoader('Submitting exam...');

    const timeTaken = Math.floor((new Date() - startTime) / 1000);
    const result = await resultService.submitExam(currentAttempt.id, timeTaken);

    ExamUtils.hideLoader();

    if (result.success) {
      antiCheatSystem.endExam();
      window.location.href = `result.html?attemptId=${currentAttempt.id}`;
    } else {
      ExamUtils.showToast(result.error, 'error');
    }
  }
</script>
```

### 5. student/result.html (View Results)

**Purpose**: Display exam results and performance

```html
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const user = await authService.getCurrentUser();
    if (!user) {
      window.location.href = 'student.html';
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const attemptId = urlParams.get('attemptId');

    if (!attemptId) {
      ExamUtils.showToast('No result found', 'error');
      window.location.href = 'studenthome.html';
      return;
    }

    await loadResult(attemptId);
  });

  async function loadResult(attemptId) {
    ExamUtils.showLoader('Loading result...');

    const result = await resultService.getResult(attemptId);

    ExamUtils.hideLoader();

    if (!result) {
      ExamUtils.showToast('Failed to load result', 'error');
      return;
    }

    // Display result summary
    const { attempt, answers } = result;
    
    document.querySelector('[data-exam-title]').textContent = attempt.exams.title;
    document.querySelector('[data-score]').textContent = 
      `${attempt.score} / ${attempt.total_marks}`;
    document.querySelector('[data-percentage]').textContent = 
      `${attempt.percentage.toFixed(2)}%`;
    document.querySelector('[data-grade]').textContent = 
      ExamUtils.getGrade(attempt.percentage);
    document.querySelector('[data-duration]').textContent = 
      ExamUtils.formatDuration(attempt.time_taken_seconds);

    // Display detailed answers
    const detailsContainer = document.querySelector('[data-details-container]');
    detailsContainer.innerHTML = answers.map((answer, index) => `
      <div class="question-detail ${answer.is_correct ? 'correct' : 'incorrect'}">
        <h4>Q${index + 1}: ${answer.exam_questions.question_text}</h4>
        <p><strong>Your Answer:</strong> ${answer.selected_option}</p>
        <p><strong>Correct Answer:</strong> ${answer.exam_questions.correct_answer}</p>
        ${answer.exam_questions.explanation ? 
          `<p><strong>Explanation:</strong> ${answer.exam_questions.explanation}</p>` : ''}
      </div>
    `).join('');
  }

  function downloadPDF() {
    const element = document.querySelector('[data-result-content]');
    const opt = {
      margin: 10,
      filename: 'exam-result.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    
    html2pdf().set(opt).from(element).save();
  }
</script>
```

### 6. student/testhistory.html (Exam History)

**Purpose**: Show all past exam attempts

```html
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const user = await authService.getCurrentUser();
    if (!user) {
      window.location.href = 'student.html';
      return;
    }

    await loadAttempts(user.id);
  });

  async function loadAttempts(studentId) {
    ExamUtils.showLoader('Loading history...');

    const attempts = await resultService.getStudentAttempts(studentId);

    ExamUtils.hideLoader();

    const container = document.querySelector('[data-attempts-container]');
    
    if (attempts.length === 0) {
      container.innerHTML = '<p>No exam history</p>';
      return;
    }

    container.innerHTML = attempts.map(attempt => `
      <tr>
        <td>${attempt.exams.title}</td>
        <td>${attempt.exams.subject}</td>
        <td>${attempt.score}/${attempt.total_marks}</td>
        <td>${attempt.percentage.toFixed(2)}%</td>
        <td>${ExamUtils.formatDate(attempt.submitted_at)}</td>
        <td>
          <button onclick="viewResult('${attempt.id}')">View Result</button>
        </td>
      </tr>
    `).join('');
  }

  function viewResult(attemptId) {
    window.location.href = `result.html?attemptId=${attemptId}`;
  }
</script>
```

### 7. teacher/teacher.html (Teacher Login/Signup)

**Similar to student/student.html but with role='teacher'**

```javascript
const result = await authService.signup(email, password, name, 'teacher');
```

### 8. teacher/teacherhome.html (Teacher Dashboard)

**Purpose**: Teacher exam management dashboard

```html
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    const user = await authService.getCurrentUser();
    if (!user) {
      window.location.href = 'teacher.html';
      return;
    }

    const role = await authService.getUserRole();
    if (role !== 'teacher') {
      window.location.href = '../index.html';
      return;
    }

    await loadTeacherExams(user.id);
    await loadAnalytics(user.id);
  });

  async function loadTeacherExams(teacherId) {
    const exams = await examService.getTeacherExams(teacherId);

    const container = document.querySelector('[data-exams-container]');
    container.innerHTML = exams.map(exam => `
      <div class="exam-card">
        <h3>${exam.title}</h3>
        <p>Status: ${exam.status}</p>
        <p>Duration: ${exam.duration_minutes} min | Marks: ${exam.total_marks}</p>
        <button onclick="editExam('${exam.id}')">Edit</button>
        <button onclick="deleteExam('${exam.id}')">Delete</button>
      </div>
    `).join('');
  }

  async function loadAnalytics(teacherId) {
    const analytics = await analyticsService.getTeacherAnalytics(teacherId);

    document.querySelector('[data-total-exams]').textContent = analytics.totalExams;
    document.querySelector('[data-total-students]').textContent = analytics.totalStudents;
    document.querySelector('[data-avg-score]').textContent = 
      parseFloat(analytics.averageClassScore).toFixed(2);
  }

  function createNewExam() {
    window.location.href = 'teacherassignment.html';
  }
</script>
```

### 9. common/leaderboard.html (Global Leaderboard)

**Purpose**: Display student rankings

```html
<script>
  document.addEventListener('DOMContentLoaded', async () => {
    await loadLeaderboard();
  });

  async function loadLeaderboard() {
    ExamUtils.showLoader('Loading leaderboard...');

    const leaderboard = await analyticsService.getLeaderboard(100);

    ExamUtils.hideLoader();

    const container = document.querySelector('[data-leaderboard-container]');

    if (leaderboard.length === 0) {
      container.innerHTML = '<p>No data available</p>';
      return;
    }

    container.innerHTML = leaderboard.map((entry, index) => `
      <tr>
        <td>${entry.rank || index + 1}</td>
        <td>${entry.profiles.name}</td>
        <td>${entry.profiles.roll_no}</td>
        <td>${entry.average_marks.toFixed(2)}%</td>
        <td>${entry.best_score}</td>
        <td>${entry.total_exams_taken}</td>
      </tr>
    `).join('');
  }
</script>
```

---

## Common Implementation Patterns

### Authentication Guard
```javascript
async function requireAuth() {
  const user = await authService.getCurrentUser();
  if (!user) {
    window.location.href = '../index.html';
  }
  return user;
}

async function requireRole(allowedRoles) {
  const user = await requireAuth();
  const role = await authService.getUserRole();
  
  if (!allowedRoles.includes(role)) {
    window.location.href = '../index.html';
  }
  return user;
}
```

### Loading Data with Error Handling
```javascript
async function loadData() {
  try {
    ExamUtils.showLoader('Loading...');
    
    const data = await someService.getData();
    
    ExamUtils.hideLoader();
    
    if (!data) {
      ExamUtils.showToast('No data found', 'warning');
      return;
    }
    
    displayData(data);
  } catch (error) {
    ExamUtils.hideLoader();
    ExamUtils.showToast(error.message, 'error');
    console.error('Error:', error);
  }
}
```

### Form Submission
```javascript
const form = document.querySelector('#myForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  ExamUtils.showLoader('Saving...');
  
  const result = await service.create(data);
  
  ExamUtils.hideLoader();
  
  if (result.success) {
    ExamUtils.showToast('Saved successfully', 'success');
    // Refresh or redirect
  } else {
    ExamUtils.showToast(result.error, 'error');
  }
});
```

---

## Path Management

**Important**: When including scripts in nested pages, adjust relative paths:

- `student/studenthome.html` → Use `../script.js`
- `teacher/teacherhome.html` → Use `../script.js`
- `index.html` → Use `./script.js`

---

## Testing Integration

After integrating all pages:

1. ✅ Visit index.html → Can select role
2. ✅ Signup creates account
3. ✅ Login redirects to correct dashboard
4. ✅ Can create exam (teacher)
5. ✅ Can add questions (teacher)
6. ✅ Can take exam (student)
7. ✅ Results display correctly
8. ✅ Leaderboard shows students
9. ✅ Analytics display data

---

## Troubleshooting

**Pages showing "Not authenticated"**:
- Ensure Supabase credentials are correct
- Check browser DevTools Network tab
- Verify localStorage is enabled

**Scripts not loading**:
- Check file paths are correct
- Verify no 404 errors in console
- Check script includes in order

**Services showing "undefined"**:
- Ensure all service files are included
- Check console for errors
- Verify Supabase initialization

---

**Last Updated**: 2026-05-22  
**Status**: Ready for Integration ✅
