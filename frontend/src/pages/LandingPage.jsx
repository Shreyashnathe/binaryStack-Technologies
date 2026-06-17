import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
    }
  }, [user, navigate]);

  const features = [
    { icon: '01', title: 'Industry-aligned Curriculum', desc: 'Java, Spring Boot, React, and system design modules mapped to practical job expectations.' },
    { icon: '02', title: 'Mentor-led Execution', desc: 'Weekly guidance sessions with real code reviews and implementation checkpoints.' },
    { icon: '03', title: 'Operational Dashboards', desc: 'Role-based visibility for students and admins to monitor growth, sessions, and enrollments.' },
    { icon: '04', title: 'Integrated AI Support', desc: 'Built-in assistant for concept clarity, debugging help, and interview-level explanations.' },
  ];

  const outcomes = [
    {
      tag: 'Delivery',
      value: '96%',
      title: 'Session Completion',
      caption: 'Consistent batch execution with mentor-supervised outcomes.',
    },
    {
      tag: 'Learners',
      value: '1,200+',
      title: 'Active Students',
      caption: 'Ongoing technical learning tracks across backend and frontend cohorts.',
    },
    {
      tag: 'Mentorship',
      value: '40+ hrs',
      title: 'Weekly Support',
      caption: 'Technical doubt solving, project reviews, and interview preparation.',
    },
  ];

  const deliveryFlow = [
    {
      title: 'Structured Onboarding',
      desc: 'Detailed learner profiles enable personalized recommendations from day one.',
    },
    {
      title: 'Guided Class Blocks',
      desc: 'Scheduled sessions, live support, and focused implementation exercises.',
    },
    {
      title: 'Measured Progress',
      desc: 'Dashboards and enrollment analytics help track consistency and outcomes.',
    },
  ];

  return (
    <div className="min-h-screen bg-dark-900 pt-24">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-sm text-white font-bold shadow-sm">
              B
            </div>
            <span className="text-xl font-bold text-slate-900 whitespace-nowrap">BinaryStack <span className="text-primary-700">Technologies</span></span>
          </div>
          <div className="hidden md:flex items-center gap-5 text-sm text-slate-600 font-medium whitespace-nowrap shrink-0">
            <a href="#programs" className="hover:text-slate-900 transition-colors">Programs</a>
            <a href="#framework" className="hover:text-slate-900 transition-colors">Framework</a>
            <a href="#outcomes" className="hover:text-slate-900 transition-colors">Outcomes</a>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/login"    className="btn-secondary text-sm whitespace-nowrap">Login</Link>
            <Link to="/register" className="btn-primary  text-sm whitespace-nowrap">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <span className="showcase-kicker">Professional Coaching Platform</span>
            <h1 className="mt-5 text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Build Production-Ready
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800">Software Skills</span>
            </h1>
            <p className="text-slate-600 text-lg mt-5 max-w-xl leading-relaxed">
              Structured curriculum, mentor-led sessions, practical assignments, and AI assistance in one integrated learning workspace.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link to="/register" className="btn-primary text-base px-8 py-3">Create Student Account</Link>
              <Link to="/login" className="btn-secondary text-base px-8 py-3">Sign In</Link>
            </div>
          </div>

          <article className="card">
            <h2 className="text-xl font-bold text-slate-900">Why teams choose BinaryStack</h2>
            <p className="text-slate-600 text-sm mt-2">Execution-oriented training with measurable progress and transparent class operations.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              {outcomes.map((block) => (
                <article key={block.title} className="showcase-block bg-slate-50 border-slate-200 p-4">
                  <span className="showcase-kicker">{block.tag}</span>
                  <p className="text-2xl font-extrabold text-slate-900 mt-2">{block.value}</p>
                  <h3 className="text-slate-900 font-semibold text-sm mt-2">{block.title}</h3>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed">{block.caption}</p>
                </article>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section id="programs" className="max-w-7xl mx-auto px-8 pb-24">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
          Built for <span className="text-primary-700">serious engineering growth</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <article key={i} className="showcase-block hover:border-primary-600/40 transition-all duration-200 text-left group">
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 text-sm font-bold mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                {f.icon}
              </div>
              <h3 className="text-slate-900 font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="framework" className="max-w-7xl mx-auto px-8 pb-24">
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Execution Framework</h2>
              <p className="text-slate-600 mt-2">A structured workflow that keeps learning, delivery, and outcomes tightly aligned.</p>
            </div>
            <Link to="/register" className="btn-primary text-sm">Join the Next Batch</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {deliveryFlow.map((step, index) => (
              <article key={step.title} className="showcase-block bg-slate-50 border-slate-200">
                <span className="showcase-kicker">Step {index + 1}</span>
                <h3 className="text-slate-900 font-semibold text-lg mt-3">{step.title}</h3>
                <p className="showcase-caption">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer id="outcomes" className="border-t border-slate-200 py-6 text-center">
        <p className="text-slate-500 text-sm">
          Copyright 2026 BinaryStack Technologies. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
