import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { getCourses } from '../api/api';

// Fallback high-quality courses if the API is empty or offline
const FALLBACK_COURSES = [
  {
    id: 101,
    title: 'Java Full Stack Accelerator',
    description: 'Master core Java, concurrency, Hibernate, Spring Boot, and build production-ready full-stack applications with React.',
    price: 8999,
    hours: '64 hrs',
    rating: 4.9,
    gradColor: 'from-blue-600 to-indigo-600'
  },
  {
    id: 102,
    title: 'Spring Boot & Microservices',
    description: 'Deep dive into Spring Cloud, service registry, API gateways, Eureka, resilience design, and cloud-native Kubernetes deployment.',
    price: 6999,
    hours: '45 hrs',
    rating: 4.8,
    gradColor: 'from-purple-600 to-pink-600'
  },
  {
    id: 103,
    title: 'Modern Frontend with React',
    description: 'Build responsive, fast web interfaces using React 19, Vite, state managers, custom hooks, and Tailwind CSS animations.',
    price: 4999,
    hours: '38 hrs',
    rating: 4.9,
    gradColor: 'from-cyan-500 to-blue-500'
  },
  {
    id: 104,
    title: 'Database Engineering & SQL',
    description: 'Learn relational database modeling, indexing strategy, query optimization, indexing, and advanced transactions in MySQL & PostgreSQL.',
    price: 3999,
    hours: '30 hrs',
    rating: 4.7,
    gradColor: 'from-emerald-500 to-teal-500'
  }
];

// High-performance scroll-triggered count-up component
function CountUp({ end, suffix = '', duration = 1500 }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef(null);

  useEffect(() => {
    let started = false;
    const currentElement = elementRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !started) {
          started = true;
          let startTimestamp = null;
          const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [end, duration]);

  return <span ref={elementRef} className="tabular-nums">{count}{suffix}</span>;
}

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef(null);

  // Redirect if logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
    }
  }, [user, navigate]);

  // Fetch courses on mount
  useEffect(() => {
    getCourses()
      .then((res) => {
        // If empty, use fallback. Otherwise use API list.
        const fetched = res.data || [];
        setCourses(fetched.length > 0 ? fetched : FALLBACK_COURSES);
      })
      .catch((err) => {
        console.error('Failed to load courses from API, using fallback.', err);
        setCourses(FALLBACK_COURSES);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Listen for scroll to toggle sticky navbar shadow/height
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll handler
  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Horizontal scroll controls
  const scrollDirection = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const offset = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      scrollRef.current.scrollTo({ left: scrollLeft + offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-primary-500 selection:text-white relative overflow-hidden">
      
      {/* Background Decorative Glow Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-200/30 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[40%] right-[-10%] w-[45%] h-[45%] bg-purple-200/20 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Sticky Navbar */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/80 py-3 shadow-md' 
          : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <a href="#home" onClick={(e) => handleScrollTo(e, 'home')} className="flex items-center gap-3 shrink-0 focus:outline-none">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md transform hover:rotate-6 transition-transform duration-200">
              B
            </div>
            <span className="text-xl font-extrabold text-slate-900 tracking-tight">
              BinaryStack <span className="text-primary-600 bg-clip-text">Technologies</span>
            </span>
          </a>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="hover:text-primary-600 transition-colors">Benefits</a>
            <a href="#courses" onClick={(e) => handleScrollTo(e, 'courses')} className="hover:text-primary-600 transition-colors">Courses</a>
            <a href="#how-it-works" onClick={(e) => handleScrollTo(e, 'how-it-works')} className="hover:text-primary-600 transition-colors">How it Works</a>
            <a href="#testimonials" onClick={(e) => handleScrollTo(e, 'testimonials')} className="hover:text-primary-600 transition-colors">Reviews</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-slate-700 hover:text-primary-600 transition-colors px-3 py-2">
              Login
            </Link>
            <Link to="/register" className="btn-primary text-sm px-5 py-2.5 rounded-xl font-bold">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="max-w-7xl mx-auto px-6 md:px-8 pt-32 pb-20 md:pt-40 md:pb-28 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary-700 uppercase tracking-wide">
              <span>★</span> Rated 4.9/5 by 1,200+ Learners
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Build Industry-Ready <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700">
                Software Skills
              </span>
            </h1>

            <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-2xl">
              Master Java, Spring Boot, React, and Database design. Gain engineering competency with weekly guided cohorts, interactive labs, custom AI assistance, and verified mentor code reviews.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
              <Link to="/register" className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-primary-600/20 text-center">
                Get Started Free
              </Link>
              <a 
                href="#courses" 
                onClick={(e) => handleScrollTo(e, 'courses')} 
                className="btn-secondary text-base px-8 py-3.5 text-center flex items-center justify-center gap-2 hover:border-slate-400 hover:text-slate-900"
              >
                Browse Courses
              </a>
            </div>
          </div>

          {/* Right Visual Panel (Glassmorphic Mockup) */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="w-full max-w-md bg-white/50 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-2xl relative z-10 overflow-hidden transform hover:-rotate-1 transition-transform duration-300">
              
              {/* Glass overlay headers */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                </div>
                <div className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Workspace</div>
              </div>

              {/* Mock active learning items */}
              <div className="space-y-4">
                <div className="p-4 bg-white/90 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 text-primary-600 font-bold rounded-xl flex items-center justify-center text-sm shrink-0">
                    Java
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-xs truncate">Spring Boot Framework</p>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div className="w-[78%] h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">78%</span>
                </div>

                <div className="p-4 bg-white/90 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 font-bold rounded-xl flex items-center justify-center text-sm shrink-0">
                    AI
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-xs">AI Coding Companion</p>
                    <p className="text-[10px] text-slate-500 mt-1 truncate">"Injecting enrollment context..."</p>
                  </div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                </div>

                <div className="p-4 bg-white/90 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                  <div className="w-10 h-10 bg-cyan-100 text-cyan-600 font-bold rounded-xl flex items-center justify-center text-sm shrink-0">
                    UI
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 text-xs">React 19 & Tailwind CSS</p>
                    <p className="text-[10px] text-slate-500 mt-1">Cohort Starts tomorrow</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">Pending</span>
                </div>
              </div>

              {/* Decorative floating badges */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-full shadow-lg transform rotate-6 animate-bounce">
                New!
              </div>
            </div>
            {/* Glowing orb decorations behind the mockup */}
            <div className="absolute top-[20%] right-[-10px] w-40 h-40 bg-gradient-to-tr from-primary-400 to-indigo-500 rounded-full blur-[80px] opacity-40 -z-10 animate-pulse" />
          </div>

        </div>
      </section>

      {/* Stats Bar (Scroll Triggered Count-Up) */}
      <section id="stats" className="border-y border-slate-200/80 bg-white relative z-10 py-10">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            <div className="pt-0">
              <p className="text-4xl md:text-5xl font-black text-slate-900">
                <CountUp end={1200} suffix="+" />
              </p>
              <p className="text-xs md:text-sm font-bold text-slate-500 tracking-wide uppercase mt-2">Active Students</p>
            </div>
            <div className="pt-6 lg:pt-0">
              <p className="text-4xl md:text-5xl font-black text-slate-900">
                <CountUp end={15} suffix="+" />
              </p>
              <p className="text-xs md:text-sm font-bold text-slate-500 tracking-wide uppercase mt-2">Certified Courses</p>
            </div>
            <div className="pt-6 lg:pt-0">
              <p className="text-4xl md:text-5xl font-black text-slate-900">
                <CountUp end={350} suffix="+" />
              </p>
              <p className="text-xs md:text-sm font-bold text-slate-500 tracking-wide uppercase mt-2">Sessions Held</p>
            </div>
            <div className="pt-6 lg:pt-0">
              <p className="text-4xl md:text-5xl font-black text-slate-900">
                <CountUp end={98} suffix="%" />
              </p>
              <p className="text-xs md:text-sm font-bold text-slate-500 tracking-wide uppercase mt-2">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-28 relative z-10 text-center">
        <div className="max-w-3xl mx-auto space-y-4 mb-16">
          <span className="showcase-kicker bg-primary-50 text-primary-700 border-primary-100">Why BinaryStack</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for Practical Engineering Mastery
          </h2>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            Skip the generic video tutorials. Learn from structured cohorts designed with code execution, mentor oversight, and dynamic assistance tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Live Sessions */}
          <article className="showcase-block bg-white text-left p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-bold text-lg mb-2">Live Coding Sessions</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Interactive video cohorts with experienced engineers. Walk through code reviews, system designs, and live debug drills weekly.
            </p>
          </article>

          {/* AI Assistant */}
          <article className="showcase-block bg-white text-left p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-bold text-lg mb-2">Contextual AI Assistant</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Get dynamic guidance based on your academic path, progress, and active enrollments. Real-time answers tailored to you.
            </p>
          </article>

          {/* Certified Courses */}
          <article className="showcase-block bg-white text-left p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-bold text-lg mb-2">Verified Certifications</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Earn shareable completion credentials representing production-standard software engineering capability.
            </p>
          </article>

          {/* Secure Payments */}
          <article className="showcase-block bg-white text-left p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-slate-900 font-bold text-lg mb-2">Secure Checkout</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Hassle-free, encrypted payments powered by Razorpay. Enroll instantly and manage clear invoices and downloadable receipts.
            </p>
          </article>

        </div>
      </section>

      {/* Courses Preview Section */}
      <section id="courses" className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-28 bg-slate-100/50 rounded-[2.5rem] border border-slate-200/40 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div className="text-left space-y-4">
            <span className="showcase-kicker bg-slate-200 text-slate-700 border-slate-300">Browse Programs</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Explore Our Training Cohorts
            </h2>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              High-intensity cohorts structured to take you from fundamentals to architecture.
            </p>
          </div>
          
          {/* Scroll Navigation Buttons for Desktop */}
          <div className="hidden md:flex gap-3">
            <button 
              onClick={() => scrollDirection('left')} 
              className="w-11 h-11 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-950 font-bold rounded-xl shadow-sm flex items-center justify-center transition-all duration-150 active:scale-95"
              aria-label="Scroll left"
            >
              ←
            </button>
            <button 
              onClick={() => scrollDirection('right')} 
              className="w-11 h-11 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-950 font-bold rounded-xl shadow-sm flex items-center justify-center transition-all duration-150 active:scale-95"
              aria-label="Scroll right"
            >
              →
            </button>
          </div>
        </div>

        {/* Scrollable Row */}
        {loading ? (
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3].map((n) => (
              <div key={n} className="w-[310px] shrink-0 bg-white border border-slate-200 rounded-3xl p-5 animate-pulse">
                <div className="w-full h-36 bg-slate-200 rounded-2xl mb-4" />
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-200 rounded w-full mb-2" />
                <div className="h-3 bg-slate-200 rounded w-5/6 mb-5" />
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-slate-200 rounded w-1/4" />
                  <div className="h-9 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-6 pb-6 pt-2 snap-x scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
          >
            {courses.map((course, index) => {
              // Extract colors or assign random premium gradient
              const gradients = [
                'from-blue-600 to-indigo-600',
                'from-purple-600 to-pink-600',
                'from-cyan-500 to-blue-500',
                'from-emerald-500 to-teal-500'
              ];
              const grad = course.gradColor || gradients[index % gradients.length];
              const displayRating = course.rating || (4.5 + (index % 5) * 0.1).toFixed(1);
              const displayHours = course.hours || '32 hrs';

              return (
                <article 
                  key={course.id}
                  className="w-[310px] shrink-0 bg-white border border-slate-200/80 hover:border-primary-400 rounded-3xl p-5 shadow-sm hover:shadow-lg snap-start flex flex-col justify-between transition-all duration-300 relative group"
                >
                  <div>
                    {/* Card Cover Gradient Accent */}
                    <div className={`w-full h-32 bg-gradient-to-br ${grad} rounded-2xl mb-4 relative overflow-hidden flex items-center justify-center`}>
                      <span className="text-white/20 font-black text-6xl uppercase select-none">{course.title.substring(0, 2)}</span>
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-0.5 rounded-lg text-[10px] font-bold text-slate-800 flex items-center gap-1 shadow-sm">
                        <span>★</span> {displayRating}
                      </div>
                    </div>

                    {/* Metadata Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md uppercase">
                        {displayHours} content
                      </span>
                    </div>

                    <h3 className="text-slate-900 font-extrabold text-lg group-hover:text-primary-700 transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    
                    <p className="text-slate-500 text-xs leading-relaxed mt-2 line-clamp-3">
                      {course.description}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Investment</p>
                      <p className="text-base font-extrabold text-slate-900">INR {course.price}</p>
                    </div>
                    
                    <Link 
                      to="/register"
                      className="inline-flex items-center justify-center bg-slate-900 hover:bg-primary-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all duration-200"
                    >
                      Learn More
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-28 relative z-10 text-center">
        <div className="max-w-3xl mx-auto space-y-4 mb-16">
          <span className="showcase-kicker bg-primary-50 text-primary-700 border-primary-100">Step-by-Step Guide</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            How BinaryStack Works
          </h2>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            Begin your journey towards software engineering competency in three simple checkpoints.
          </p>
        </div>

        {/* Steps container */}
        <div className="relative max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 z-10">
          
          {/* Connecting dashed line - Desktop only */}
          <div className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-slate-200 z-0" />

          {/* Step 1 */}
          <div className="flex flex-col items-center text-center space-y-4 relative z-10 group">
            <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-200 group-hover:border-primary-600 text-slate-600 group-hover:text-primary-600 shadow-md flex items-center justify-center font-black text-xl transition-all duration-300">
              1
            </div>
            <h3 className="text-slate-900 font-bold text-lg">Create Account</h3>
            <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
              Sign up as a student. Pre-populate your academic goals and programming target roles.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center space-y-4 relative z-10 group">
            <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-200 group-hover:border-primary-600 text-slate-600 group-hover:text-primary-600 shadow-md flex items-center justify-center font-black text-xl transition-all duration-300">
              2
            </div>
            <h3 className="text-slate-900 font-bold text-lg">Enroll in Cohort</h3>
            <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
              Select your course path, checkout securely via integrated payments, and join the cohort dashboard.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center space-y-4 relative z-10 group">
            <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-200 group-hover:border-primary-600 text-slate-600 group-hover:text-primary-600 shadow-md flex items-center justify-center font-black text-xl transition-all duration-300">
              3
            </div>
            <h3 className="text-slate-900 font-bold text-lg">Learn & Accelerate</h3>
            <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
              Attend live reviews, check schedules, consult the prompt-trained AI Assistant, and earn certifications.
            </p>
          </div>

        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 md:px-8 py-20 md:py-28 bg-slate-900 text-slate-100 rounded-[2.5rem] relative z-10 overflow-hidden">
        
        {/* Background glow for testimonials */}
        <div className="absolute top-[50%] left-[50%] w-[60%] h-[60%] -translate-x-1/2 -translate-y-1/2 bg-primary-700/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto space-y-4 mb-16 text-center">
          <span className="showcase-kicker bg-white/10 text-slate-200 border-white/10">Learner Reviews</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Loved by Driven Engineers
          </h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Here's what our students have accomplished using BinaryStack's structured curriculum.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          
          {/* Card 1 */}
          <article className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-extrabold flex items-center justify-center text-sm shadow-inner">
                AK
              </div>
              <div>
                <p className="font-bold text-sm text-white">Amit Kumar</p>
                <p className="text-[10px] text-slate-400">Software Engineer Intern</p>
              </div>
            </div>
            <div className="text-amber-400 text-xs">★★★★★</div>
            <p className="text-slate-300 text-xs leading-relaxed italic">
              "The mentor reviews and structured Spring Boot modules helped me understand how production applications are written. The AI assistant helped clear concepts overnight before coding reviews."
            </p>
          </article>

          {/* Card 2 */}
          <article className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-white font-extrabold flex items-center justify-center text-sm shadow-inner">
                SP
              </div>
              <div>
                <p className="font-bold text-sm text-white">Sneha Patel</p>
                <p className="text-[10px] text-slate-400">Junior Frontend Architect</p>
              </div>
            </div>
            <div className="text-amber-400 text-xs">★★★★★</div>
            <p className="text-slate-300 text-xs leading-relaxed italic">
              "The React dashboard is incredibly responsive. I registered, enrolled in the Modern Frontend cohort, checked out via Razorpay in minutes, and started coding with a structured course schedule."
            </p>
          </article>

          {/* Card 3 */}
          <article className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-extrabold flex items-center justify-center text-sm shadow-inner">
                RS
              </div>
              <div>
                <p className="font-bold text-sm text-white">Rahul Sharma</p>
                <p className="text-[10px] text-slate-400">System Engineer</p>
              </div>
            </div>
            <div className="text-amber-400 text-xs">★★★★★</div>
            <p className="text-slate-300 text-xs leading-relaxed italic">
              "Database indexing and SQL optimizations explained here saved my backend queries at work. The execution-focused platform ensures you write actual code rather than just watching lectures."
            </p>
          </article>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white pt-16 pb-8 mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-left">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white font-extrabold text-xs">
                B
              </div>
              <span className="font-extrabold text-slate-900">BinaryStack</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Accelerating technical capability with structured cohorts, mentor checkins, and custom developer tools.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-4">
            <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wide">Quick Links</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><Link to="/login" className="hover:text-primary-600">Student Sign In</Link></li>
              <li><Link to="/register" className="hover:text-primary-600">Register Portal</Link></li>
              <li><a href="#courses" onClick={(e) => handleScrollTo(e, 'courses')} className="hover:text-primary-600">Available Courses</a></li>
            </ul>
          </div>

          {/* Inner Pages Links */}
          <div className="space-y-4">
            <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wide">Programs</h4>
            <ul className="space-y-2 text-xs font-semibold text-slate-500">
              <li><a href="#courses" onClick={(e) => handleScrollTo(e, 'courses')} className="hover:text-primary-600">Java & Backend</a></li>
              <li><a href="#courses" onClick={(e) => handleScrollTo(e, 'courses')} className="hover:text-primary-600">React & Frontend</a></li>
              <li><a href="#courses" onClick={(e) => handleScrollTo(e, 'courses')} className="hover:text-primary-600">Database Engineering</a></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-4">
            <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wide">Contact Us</h4>
            <ul className="space-y-2 text-xs text-slate-500 leading-relaxed font-semibold">
              <li>✉ info@binarystack.tech</li>
              <li>☎ +91 98765 43210</li>
              <li>📍 BinaryStack Tech Park, Pune</li>
            </ul>
          </div>

        </div>

        {/* Copyright Bar */}
        <div className="max-w-7xl mx-auto px-6 md:px-8 border-t border-slate-100 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-[11px]">
            © 2026 BinaryStack Technologies. All rights reserved. Registered in India.
          </p>
          <div className="flex gap-4 text-[11px] font-semibold text-slate-400">
            <a href="#home" onClick={(e) => handleScrollTo(e, 'home')} className="hover:text-slate-600">Terms of Use</a>
            <a href="#home" onClick={(e) => handleScrollTo(e, 'home')} className="hover:text-slate-600">Privacy Policy</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
