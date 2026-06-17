import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import StatsCard from '../../components/StatsCard';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, getAllEnrollments } from '../../api/api';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const courses = stats?.totalCourses ?? 0;
  const enrollments = stats?.totalEnrollments ?? 0;
  const students = stats?.totalStudents ?? 0;
  const enrollmentDensity = courses > 0 ? (enrollments / courses).toFixed(1) : '0.0';
  const studentCoverage = students > 0 ? Math.round((enrollments / students) * 100) : 0;

  const actionBlocks = [
    {
      title: 'Manage Course Catalog',
      desc: 'Create and update modules aligned with your current batch roadmap.',
      to: '/admin/courses',
      actionLabel: 'Open Courses',
      tag: 'Academics',
    },
    {
      title: 'Run Communication Hub',
      desc: 'Publish timely updates and keep all student communication centralized.',
      to: '/admin/announcements',
      actionLabel: 'Open Announcements',
      tag: 'Communication',
    },
    {
      title: 'Control Live Schedule',
      desc: 'Plan mentor sessions with clear timing, mode, and delivery context.',
      to: '/admin/sessions',
      actionLabel: 'Open Schedule',
      tag: 'Operations',
    },
  ];

  useEffect(() => {
    Promise.all([getDashboardStats(), getAllEnrollments()])
      .then(([statsRes, enrollRes]) => {
        setStats(statsRes.data);
        setRecentEnrollments(enrollRes.data.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back, <span className="text-primary-700">{user?.name}</span></p>
      </div>

      {loading ? (
        <div className="text-slate-600 animate-pulse">Loading stats...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <StatsCard label="Total Students" value={stats?.totalStudents} icon="ST" color="blue" hint="Registered learners" />
            <StatsCard label="Total Courses" value={stats?.totalCourses} icon="CR" color="purple" hint="Live catalog count" />
            <StatsCard label="Total Enrollments" value={stats?.totalEnrollments} icon="EN" color="green" hint="All course registrations" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <article className="showcase-block">
              <span className="showcase-kicker">Performance</span>
              <p className="showcase-value">{enrollmentDensity}</p>
              <h3 className="text-slate-900 font-semibold text-lg mt-3">Avg. Enrollments per Course</h3>
              <p className="showcase-caption">Tracks how effectively your catalog converts into active participation.</p>
            </article>
            <article className="showcase-block">
              <span className="showcase-kicker">Engagement</span>
              <p className="showcase-value">{studentCoverage}%</p>
              <h3 className="text-slate-900 font-semibold text-lg mt-3">Enrollment Coverage</h3>
              <p className="showcase-caption">Indicates how many students are mapped into at least one learning stream.</p>
            </article>
            <article className="showcase-block">
              <span className="showcase-kicker">Governance</span>
              <p className="showcase-value">{recentEnrollments.length}</p>
              <h3 className="text-slate-900 font-semibold text-lg mt-3">Recent Activity Log</h3>
              <p className="showcase-caption">Latest enrollments surfaced for quick review and verification.</p>
            </article>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {actionBlocks.map((block) => (
              <article key={block.title} className="showcase-block">
                <span className="showcase-kicker">{block.tag}</span>
                <h3 className="text-slate-900 font-semibold text-lg mt-3">{block.title}</h3>
                <p className="showcase-caption">{block.desc}</p>
                <Link to={block.to} className="showcase-action">{block.actionLabel}</Link>
              </article>
            ))}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Enrollments</h2>
            {recentEnrollments.length === 0 ? (
              <p className="text-slate-600 text-sm">No enrollments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className="text-left pb-3 font-medium">Student</th>
                      <th className="text-left pb-3 font-medium">Course</th>
                      <th className="text-left pb-3 font-medium">Enrolled At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {recentEnrollments.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-100/70 transition-colors">
                        <td className="py-3 text-slate-900">{e.studentName}</td>
                        <td className="py-3 text-slate-700">{e.courseTitle}</td>
                        <td className="py-3 text-slate-500">{new Date(e.enrolledAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
