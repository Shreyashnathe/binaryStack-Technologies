import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import { getStudentEnrollments, getCourses } from '../../api/api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [loading, setLoading] = useState(true);

  const enrolledCount = enrollments.length;
  const coveragePercent = totalCourses > 0 ? Math.round((enrolledCount / totalCourses) * 100) : 0;
  const availableCount = Math.max(totalCourses - enrolledCount, 0);

  const actionBlocks = [
    {
      title: 'Browse Available Courses',
      desc: 'Review catalog updates and enroll in your next learning block.',
      to: '/student/courses',
      actionLabel: 'Open Courses',
      tag: 'Learning',
    },
    {
      title: 'Check Announcements',
      desc: 'Stay updated with class notices, deadlines, and mentor instructions.',
      to: '/student/announcements',
      actionLabel: 'Open Announcements',
      tag: 'Updates',
    },
    {
      title: 'View Session Schedule',
      desc: 'Track upcoming live sessions with timings and meeting details.',
      to: '/student/schedule',
      actionLabel: 'Open Schedule',
      tag: 'Sessions',
    },
    {
      title: 'Use AI Assistant',
      desc: 'Get instant support for Java, Spring Boot, React, and interview concepts.',
      to: '/student/ai-chat',
      actionLabel: 'Open AI Assistant',
      tag: 'Support',
    },
  ];

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getStudentEnrollments(user.userId),
      getCourses(),
    ])
      .then(([enrollRes, coursesRes]) => {
        setEnrollments(enrollRes.data);
        setTotalCourses(coursesRes.data.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back, <span className="text-primary-700">{user?.name}</span></p>
      </div>

      {loading ? (
        <div className="text-slate-600 animate-pulse">Loading...</div>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="stat-card bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
              <div className="w-14 h-14 rounded-2xl bg-white border border-current/15 flex items-center justify-center text-sm font-bold tracking-wide flex-shrink-0">CR</div>
              <div>
                <p className="text-slate-500 text-sm font-medium">Courses Available</p>
                <p className="text-3xl font-bold text-slate-900 mt-0.5">{totalCourses}</p>
              </div>
            </div>
            <div className="stat-card bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
              <div className="w-14 h-14 rounded-2xl bg-white border border-current/15 flex items-center justify-center text-sm font-bold tracking-wide flex-shrink-0">EN</div>
              <div>
                <p className="text-slate-500 text-sm font-medium">Enrolled Courses</p>
                <p className="text-3xl font-bold text-slate-900 mt-0.5">{enrolledCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <article className="showcase-block">
              <span className="showcase-kicker">Progress</span>
              <p className="showcase-value">{coveragePercent}%</p>
              <h3 className="text-slate-900 font-semibold text-lg mt-3">Learning Coverage</h3>
              <p className="showcase-caption">Percentage of available courses that are already part of your plan.</p>
            </article>
            <article className="showcase-block">
              <span className="showcase-kicker">Available</span>
              <p className="showcase-value">{availableCount}</p>
              <h3 className="text-slate-900 font-semibold text-lg mt-3">Recommended Next Courses</h3>
              <p className="showcase-caption">Open modules you can join right now to continue your pathway.</p>
            </article>
            <article className="showcase-block">
              <span className="showcase-kicker">Consistency</span>
              <p className="showcase-value">{enrolledCount}</p>
              <h3 className="text-slate-900 font-semibold text-lg mt-3">Active Learning Blocks</h3>
              <p className="showcase-caption">Your current enrollment footprint across active technical modules.</p>
            </article>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
            {actionBlocks.map((block) => (
              <article key={block.title} className="showcase-block">
                <span className="showcase-kicker">{block.tag}</span>
                <h3 className="text-slate-900 font-semibold text-lg mt-3">{block.title}</h3>
                <p className="showcase-caption">{block.desc}</p>
                <Link to={block.to} className="showcase-action">{block.actionLabel}</Link>
              </article>
            ))}
          </div>

          {/* Recent enrollments */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">My Enrolled Courses</h2>
            {enrollments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-600 mb-4">You have not enrolled in any courses yet.</p>
                <a href="/student/courses" className="btn-primary inline-block text-sm">Browse Courses</a>
              </div>
            ) : (
              <div className="space-y-3">
                {enrollments.map((e) => (
                  <div key={e.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-[11px] font-bold">CR</div>
                      <div>
                        <p className="text-slate-900 font-medium text-sm">{e.courseTitle}</p>
                        <p className="text-slate-500 text-xs">Enrolled {new Date(e.enrolledAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="badge-student">Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
