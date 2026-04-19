import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import { Landing, Layout, Login, Signup, Download, About, Features, Contact, Settings } from './pages';
import * as Guru from "./pages/Guru"
import * as Student from "./pages/Student"
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { GuruProvider } from "./contexts/GuruContext";
import { StudentProvider } from "./contexts/StudentContext";

// 1. Redirects logged-in users away from public pages (Login/Signup/Landing)
const RedirectIfLoggedIn = ({ children }) => {
  const { user, role } = useAuth();

  if (user) {
    const normalizedRole = role?.toLowerCase();
    if (normalizedRole === 'teacher') return <Navigate to="/guru" replace />;
    if (normalizedRole === 'student') return <Navigate to="/student" replace />;
  }
  return children ? children : <Outlet />;
};

// 2. NEW: Protects routes based on authentication and roles
const RequireAuth = ({ allowedRole, children }) => {
  const { user, role } = useAuth();

  // If not logged in, send them to login
  if (!user) {
    return <Navigate to="/auth/login/" replace />;
  }

  // Normalize role to lowercase just in case your DB returns 'Teacher' or 'Student'
  const normalizedRole = role?.toLowerCase();

  // If logged in but wrong role, send them to their correct dashboard
  if (allowedRole && normalizedRole !== allowedRole) {
    if (normalizedRole === 'teacher') return <Navigate to="/guru" replace />;
    if (normalizedRole === 'student') return <Navigate to="/student" replace />;
    return <Navigate to="/" replace />; // Fallback
  }

  return children ? children : <Outlet />;
};


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          
          {/* ================= GURU ROUTES ================= */}
          <Route path="guru" element={
            <RequireAuth allowedRole="teacher">
              <GuruProvider>
                <Guru.Layout />
              </GuruProvider>
            </RequireAuth>
          }>
            <Route index element={<Guru.Dashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="batch/:batchid" element={<Guru.BatchDashboard />} />
            <Route path="batch/:batchid/assignments" element={<Guru.BatchAssignments />} />
            <Route path="batch/:batchid/assignments/:assignmentid" element={<Guru.AssignmentSubmissions />} />
            
            {/* Note: Removed the leading /guru/ from these paths to make them properly relative */}
            <Route path="batch/:batchid/:quizType" element={<Guru.BatchQuizList />} />
            <Route path="batch/:batchid/quizzes/new/:quizType" element={<Guru.QuizBuilder />} />
            <Route path="batch/:batchid/quizzes/:formId/dashboard" element={<Guru.QuizDashboard />} />
            <Route path="batch/:batchid/quizzes/:formId/attempt/:responseId" element={<Guru.AttemptReview />} />
          </Route>

          {/* ================= STUDENT ROUTES ================= */}
          <Route path="student" element={
            <RequireAuth allowedRole="student">
              <StudentProvider>
                <Student.Layout />
              </StudentProvider>
            </RequireAuth>
          }>
            <Route index element={<Student.Dashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="batch/:batchid" element={<Student.BatchDashboard />} />
            <Route path="batch/:batchid/quiz/:formId/take" element={<Student.QuizTake />} />
            <Route path="batch/:batchid/quiz/:formId/result/:responseId" element={<Student.QuizResult />} />
            <Route path="batch/:batchid/:quizType" element={<Student.BatchQuizList />} />
            <Route path="batch/:batchid/assignments" element={<Student.BatchAssignments />} />
  <Route path="batch/:batchid/assignment/:assignmentId" element={<Student.AssignmentSubmit />} />
          </Route>


          {/* ================= PUBLIC ROUTES ================= */}
          <Route element={<Layout withIcons={true} />}>
            <Route index element={
              <RedirectIfLoggedIn>
                <Landing />
              </RedirectIfLoggedIn>
            } />
            <Route path='about/' element={<About />} />
            <Route path='features/' element={<Features />} />
            <Route path='contact/' element={<Contact />} />
            <Route path='download/' element={<Download />} />
          </Route>

          {/* ================= AUTH ROUTES ================= */}
          <Route element={<RedirectIfLoggedIn />}>
            <Route path='/auth/' element={<Layout withIcons={false} />}>
              <Route path='login/' element={<Login />} />
              <Route path='signup/' element={<Signup />} />
            </Route>
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}