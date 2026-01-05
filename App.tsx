import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { Library, Menu, X, ChevronDown, ChevronRight, Facebook, Instagram, Twitter, Mail } from 'lucide-react';
import Loader from './components/Loader';
const About = lazy(() => import('./components/About'));
const Facilities = lazy(() => import('./components/Facilities'));
const Gallery = lazy(() => import('./components/Gallery'));
const Contact = lazy(() => import('./components/Contact'));
const Admission = lazy(() => import('./components/Admission'));
const TrophyWinners = lazy(() => import('./components/TrophyWinners'));
const CertifiedStudent = lazy(() => import('./components/CertifiedStudent'));
import ChatWidget from './components/ChatWidget';
import LightRays from './components/LightRays';
import AdvancedCTA from './components/AdvancedCTA';

const App: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showFloat, setShowFloat] = useState<boolean>(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false); // desktop gallery dropdown
  const [isGalleryPinned, setIsGalleryPinned] = useState(false); // when true, keep dropdown open after click
  const [mobileGalleryOpen, setMobileGalleryOpen] = useState(false); // mobile submenu
  const galleryRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside the gallery menu
  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (galleryRef.current && !galleryRef.current.contains(target)) {
        // only close if currently open/pinned
        if (isGalleryOpen || isGalleryPinned) {
          setIsGalleryPinned(false);
          setIsGalleryOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [isGalleryOpen, isGalleryPinned]);

  useEffect(() => {
    // Simulate initial loading sequence for advanced site feel
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      // progress calculation
      const doc = document.documentElement;
      const scrollTop = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
      const height = doc.scrollHeight - doc.clientHeight;
      const pct = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0;
      setScrollProgress(pct);
      setShowFloat(scrollTop > 220);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // Simple hash-based client routing (no extra deps).
  const [route, setRoute] = useState<string>(window.location.hash.replace('#', '') || 'home');
  const [navLoading, setNavLoading] = useState<boolean>(false);

  useEffect(() => {
    const onHash = () => {
      const newRoute = window.location.hash.replace('#', '') || 'home';
      setRoute(newRoute);
      // ensure the page opens scrolled to top when the hash changes
      try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch (e) { window.scrollTo(0, 0); }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigateTo = (routeName: string) => {
    // show loader on navigation to mimic full-page transition
    setIsMobileMenuOpen(false);
    setNavLoading(true);
    // small delay for animation -> then change route
    setTimeout(() => {
      if (routeName === 'home') {
        window.location.hash = '';
        setRoute('home');
      } else {
        window.location.hash = `#${routeName}`;
        setRoute(routeName);
      }
      // Make sure the new page is shown from the top after navigation
      try { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); } catch (e) { window.scrollTo(0, 0); }
      // keep loader for a brief moment to show transition
      setTimeout(() => setNavLoading(false), 500);
    }, 300);
  };

  if (isLoading) {
    return <Loader />;
  }

  // Show loader overlay during in-app navigation between routes
  // navLoading is true while navigateTo triggers a route change
  const showNavLoader = navLoading;

  // Content for page components has been moved to dedicated components (About/Facilities/Gallery/Contact)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        /* hero bubbles */
        .hero-bubbles{ position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: visible; }
        .hero-bubbles .bubble{ position: absolute; border-radius: 999px; opacity: 0.9; filter: blur(12px); transform: translate3d(0,0,0); }
        .bubble.orange{ background: radial-gradient(circle at 30% 30%, rgba(255,159,67,0.95), rgba(255,159,67,0.25)); }
        .bubble.blue{ background: radial-gradient(circle at 30% 30%, rgba(99,179,255,0.9), rgba(99,179,255,0.2)); }
        .bubble{ animation: rise 12s linear infinite; }
        .bubble:nth-child(1){ animation-duration: 18s; animation-delay: 0s }
        .bubble:nth-child(2){ animation-duration: 14s; animation-delay: 2s }
        .bubble:nth-child(3){ animation-duration: 16s; animation-delay: 4s }
        .bubble:nth-child(4){ animation-duration: 20s; animation-delay: 1s }
        .bubble:nth-child(5){ animation-duration: 13s; animation-delay: 3s }
        @keyframes rise{
          0%{ transform: translateY(30vh) scale(0.9) translateX(0); opacity: 0 }
          10%{ opacity: 0.6 }
          50%{ transform: translateY(-10vh) scale(1.05) translateX(20px); opacity: 0.8 }
          90%{ opacity: 0.4 }
          100%{ transform: translateY(-120vh) scale(0.9) translateX(-20px); opacity: 0 }
        }
      `}</style>

      {/* Navigation loader overlay during route transitions */}
      {showNavLoader && <Loader />}
      {/* scroll progress bar */}
      <div aria-hidden className="fixed top-0 left-0 h-1 z-60 w-full bg-transparent">
        <div
          className="h-1 bg-orange-600 shadow-md"
          style={{ width: `${scrollProgress}%`, transition: 'width 120ms linear' }}
        />
      </div>
      
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-orange-100 py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center cursor-pointer gap-4" onClick={() => navigateTo('home')}>
            <div className="w-28 h-14 md:w-32 md:h-16 flex items-center justify-center overflow-hidden">
            <img src="/img/LOGO.png" alt="Dhruv Library Logo" className="w-auto h-full object-contain" onError={(e) => {e.currentTarget.style.display='none'}} />
          </div>
              <div className="leading-tight">
                <span className={`block text-2xl font-serif font-bold tracking-widest leading-none ${scrolled ? 'text-slate-900' : 'text-slate-900'}`}>Dhruv Library</span>
                <span className="block text-[11px] text-orange-600 tracking-[0.08em] font-sans font-semibold">A town of knowledge</span>
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-6">
                {['Home', 'About', 'Facilities'].map((item) => (
                  <button
                    key={item}
                    onClick={() => navigateTo(item.toLowerCase())}
                    className="nav-link text-slate-600 hover:text-orange-600 font-medium text-sm transition-colors uppercase tracking-wider"
                  >
                    {item}
                  </button>
                ))}

                {/* Gallery dropdown (desktop) */}
                <div
                  ref={galleryRef}
                  className="relative"
                  onMouseEnter={() => setIsGalleryOpen(true)}
                  onMouseLeave={() => { if (!isGalleryPinned) setIsGalleryOpen(false); }}
                >
                  <button
                    onClick={() => {
                      // clicking toggles pin state: pinned = menu stays open until unpinned
                      if (isGalleryPinned) {
                        setIsGalleryPinned(false);
                        setIsGalleryOpen(false);
                      } else {
                        setIsGalleryPinned(true);
                        setIsGalleryOpen(true);
                      }
                    }}
                    className="nav-link inline-flex items-center text-slate-600 hover:text-orange-600 font-medium text-sm transition-colors uppercase tracking-wider"
                    aria-expanded={isGalleryOpen}
                  >
                    <span className="inline-flex items-center gap-2">Gallery
                      <ChevronDown className={`transition-transform ${isGalleryOpen ? 'rotate-180' : 'rotate-0'}`} size={16} />
                    </span>
                  </button>

                  {/* Animated dropdown: always in DOM so CSS transitions work; right-aligned */}
                  <div
                    className={`absolute top-full right-0 mt-2 w-44 bg-white rounded-md shadow-lg border border-slate-100 z-50 py-1 transform origin-top-right transition-all duration-200 ease-out ${isGalleryOpen ? 'opacity-100 translate-y-0 pointer-events-auto scale-100' : 'opacity-0 -translate-y-2 pointer-events-none scale-95'}`}
                  >
                    <button
                      onClick={() => { setIsGalleryPinned(false); navigateTo('gallery'); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-orange-50 flex items-center justify-between"
                    >
                      <span>Dhruv Gallery</span>
                                <ChevronRight size={14} className="text-slate-400" />
                    </button>
                    <button
                      onClick={() => { setIsGalleryPinned(false); navigateTo('certified-student'); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-orange-50"
                    >
                      Certified Student
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => navigateTo('contact')}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-sm font-bold shadow-lg shadow-orange-500/30 transition-all hover:scale-105 relative attract glow"
                >
                  Join Now
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-white p-2 rounded-md text-slate-600 hover:text-orange-600 shadow-sm"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-orange-100 absolute w-full shadow-xl">
            <div className="px-4 pt-2 pb-6 space-y-2">
                {['Home', 'About', 'Facilities', 'Contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => { setIsMobileMenuOpen(false); navigateTo(item.toLowerCase()); }}
                  className="nav-link block w-full text-left px-3 py-3 rounded-lg text-base font-medium text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  {item}
                </button>
              ))}

              {/* Mobile Gallery sublist */}
              <div className="border-t border-orange-50 pt-2">
                <button
                  onClick={() => setMobileGalleryOpen(!mobileGalleryOpen)}
                  className="w-full text-left px-3 py-3 rounded-lg text-base font-medium text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                    <span className="inline-flex items-center justify-between w-full">Gallery <ChevronDown className={`${mobileGalleryOpen ? 'rotate-180' : 'rotate-0'} transition-transform`} size={16} /></span>
                </button>
                {mobileGalleryOpen && (
                  <div className="pl-4 pt-1 pb-2 space-y-1">
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); navigateTo('gallery'); }}
                      className="block w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-orange-50"
                    >
                        Dhruv Gallery
                    </button>
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); navigateTo('certified-student'); }}
                      className="block w-full text-left px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-orange-50"
                    >
                      Certified Student
                    </button>
                  </div>
                )}

                {/* Floating action area (Join Now + Back to Top) */}
                <div aria-hidden className={`fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3 transition-all ${showFloat ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}>
                  <button
                    onClick={() => navigateTo('contact')}
                    className="px-4 py-3 bg-orange-600 text-white rounded-full font-semibold shadow-2xl hover:bg-orange-700 transform transition hover:scale-105 flex items-center gap-2"
                    aria-label="Join Now"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M12 2v20M2 12h20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Join Now
                  </button>

                  <button
                    onClick={() => { try { window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); } }}
                    className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-md flex items-center justify-center text-slate-700 hover:shadow-lg transition"
                    aria-label="Back to top"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M12 5l7 7-1.4 1.4L12 7.8 6.4 13.4 5 12l7-7z" fill="currentColor" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

  {route === 'home' && ( /* Hero Section */
  <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-orange-200/50 rounded-full blur-[100px] z-0"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-200/50 rounded-full blur-[100px] z-0"></div>

        {/* hero bubbles layer (orange + blue bubbles floating) */}
        <div className="hero-bubbles">
          <span className="bubble orange" style={{width: 220, height: 220, left: '8%', top: '40%'}}></span>
          <span className="bubble blue" style={{width: 160, height: 160, left: '22%', top: '65%'}}></span>
          <span className="bubble orange" style={{width: 120, height: 120, left: '60%', top: '55%'}}></span>
          <span className="bubble blue" style={{width: 200, height: 200, left: '75%', top: '35%'}}></span>
          <span className="bubble orange" style={{width: 80, height: 80, left: '45%', top: '75%'}}></span>
        </div>

        {/* LightRays canvas positioned top-center of hero */}
        <div style={{ width: '100%', height: 360, position: 'absolute', top: 0, left: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 5 }} aria-hidden>
          <div style={{ width: '100%', maxWidth: 1100, height: '100%' }}>
            <LightRays
              raysOrigin="top-center"
              raysColor="#FF8A00"
              raysSpeed={1.3}
              lightSpread={0.8}
              rayLength={1.2}
              followMouse={true}
              mouseInfluence={0.08}
              noiseAmount={0.06}
              distortion={0.03}
              className="hero-light"
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-sm font-semibold tracking-wider mb-8 animate-fade-in-up">
            WELCOME TO MEERUT'S PREMIER STUDY SPACE
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 leading-tight mb-6 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            Focus Better, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">Learn Faster.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Dhruv Library offers a peaceful, technology-enabled environment designed to help you achieve your academic and professional goals.
          </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <button 
              onClick={() => navigateTo('contact')}
              className="px-8 py-4 bg-orange-600 text-white rounded-full font-bold shadow-xl shadow-orange-500/20 hover:bg-orange-700 hover:scale-105 transition-all relative attract glow"
            >
              Book Your Seat
            </button>
            <button 
              onClick={() => navigateTo('about')}
              className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-full font-bold shadow-sm hover:border-orange-300 hover:text-orange-600 transition-all flex items-center justify-center gap-2"
            >
              Explore Library <ChevronDown size={18} />
            </button>
          </div>
        </div>
      </section>

  )}
  
  {/* Make Home a long page by including About, Facilities and Gallery below the hero */}
  {route === 'home' && (
    <>
      <Suspense fallback={<Loader />}>
        <About full={false} />
      </Suspense>
      {/* 3D location model styles (scoped for branches header) */}
      <style>{`
        .location-3d{ width:140px; height:160px; perspective:900px; }
        .location-3d .model{ width:100%; height:100%; transform-style:preserve-3d; display:flex; align-items:center; justify-content:center; animation:spin3d 8s linear infinite; }
        .location-3d .pin{ width:80px; height:110px; transform-origin:center; animation:bob 3s ease-in-out infinite; }
        .location-3d .pin .shadow{ fill:rgba(2,6,23,0.12); filter: blur(6px); transform-origin:center; }
        @keyframes spin3d{ from{ transform: rotateX(6deg) rotateY(0deg);} to{ transform: rotateX(6deg) rotateY(360deg);} }
        @keyframes bob{ 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-8px);} }
        @media (max-width:640px){ .location-3d{ display:none; } }
      `}</style>

      {/* Branches section placed below the reviews/headline in About */}
      <section id="branches" className="min-h-screen py-16 bg-white flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-start gap-6">
              <div className="location-3d" aria-hidden>
                <div className="model">
                  {/* simple pin SVG that rotates in 3D and bobs */}
                  <svg className="pin" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden>
                    <defs>
                      <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#FFB347" />
                        <stop offset="100%" stopColor="#FF6A00" />
                      </linearGradient>
                    </defs>
                    <ellipse className="shadow" cx="12" cy="30" rx="8" ry="3" fill="rgba(2,6,23,0.12)" />
                    <path d="M12 2c3.866 0 7 3.134 7 7 0 5.25-7 19-7 19s-7-13.75-7-19c0-3.866 3.134-7 7-7z" fill="url(#g1)" stroke="#b35400" strokeWidth="0.5"/>
                    <circle cx="12" cy="9" r="2.6" fill="#fff" opacity="0.9" />
                  </svg>
                </div>
              </div>

              <div className="text-center md:text-left">
                <p className="text-sm text-orange-600 font-semibold tracking-wider uppercase">Our Locations</p>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">Branches</h2>
                <p className="mt-3 text-slate-600 max-w-2xl">Explore our main and secondary branches — each designed to provide a focused, safe, and resource-rich environment for learners.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Main Branch */}
            <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-2xl transition transform hover:-translate-y-2 bg-white">
              <div className="w-full">
                <div style={{ position: 'relative', paddingTop: '56.25%' }} className="w-full overflow-hidden">
                  <iframe
                    title="Dhruv Library - Main Branch Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5296.784647267165!2d77.66700548611924!3d28.984651399736638!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390c65e2dffc30b7%3A0xc8784b55996a7f4f!2sDHRUV%20LIBRARY%20%26%20COMPUTERS!5e0!3m2!1sen!2sin!4v1767085149427!5m2!1sen!2sin"
                    style={{ border: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900">Main Branch</h3>
                <p className="mt-2 text-slate-600">Located centrally with spacious seating, quiet study zones, and full facilities — our main branch is optimized for long study sessions and group workshops.</p>
                <div className="mt-4">
                  <button
                    onClick={() => navigateTo('contact')}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md shadow-md hover:shadow-2xl transform-gpu transition-transform duration-200 hover:scale-105 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    Visit / Enquire
                  </button>
                </div>
                <div className="mt-3 text-sm">
                  <a
                    href="https://maps.app.goo.gl/nfyfTDuvZaN4F8vt8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>

            {/* Second Branch */}
            <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-100 hover:shadow-2xl transition transform hover:-translate-y-2 bg-white">
              <div className="w-full">
                <div style={{ position: 'relative', paddingTop: '56.25%' }} className="w-full overflow-hidden">
                  <iframe
                    title="Dhruv Library - Second Branch Location"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d436.0863581043132!2d77.68519548050529!3d29.02614053186999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390c657fac54ef69%3A0xd775fdb46fb10708!2sDhruv%20Library%20%E2%80%93%20Your%20Study%20Partner!5e0!3m2!1sen!2sin!4v1767084972888!5m2!1sen!2sin"
                    style={{ border: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900">Second Branch</h3>
                <p className="mt-2 text-slate-600">A compact pick-up location offering flexible timing options and quick-access services for members who prefer shorter, focused study visits.</p>
                <div className="mt-4">
                  <button
                    onClick={() => navigateTo('contact')}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md shadow-md hover:shadow-2xl transform-gpu transition-transform duration-200 hover:scale-105 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    Visit / Enquire
                  </button>
                </div>
                <div className="mt-3 text-sm">
                  <a
                    href="https://maps.app.goo.gl/kU3ptUq3GQvjKizRA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:underline"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<Loader />}>
        <Facilities />
      </Suspense>
      <Suspense fallback={<Loader />}>
        <Gallery />
      </Suspense>
      <Suspense fallback={<Loader />}>
        <TrophyWinners />
      </Suspense>
    </>
  )}
  {/* About Section (full page component) */}
  {route === 'about' && (
    <Suspense fallback={<Loader />}>
      <About full={true} />
    </Suspense>
  )}
  {/* Facilities Section (full page component) */}
  {route === 'facilities' && (
    <Suspense fallback={<Loader />}>
      <Facilities />
    </Suspense>
  )}
  {/* Gallery Section (full page component) */}
  {route === 'gallery' && (
    <Suspense fallback={<Loader />}>
      <Gallery />
    </Suspense>
  )}
  {route === 'certified-student' && (
    <Suspense fallback={<Loader />}>
      <CertifiedStudent />
    </Suspense>
  )}
  {route === 'admission' && (
    <Suspense fallback={<Loader />}>
      <Admission />
    </Suspense>
  )}
  {/* Contact Section (full page component) */}
  {route === 'contact' && (
    <Suspense fallback={<Loader />}>
      <Contact />
    </Suspense>
  )}

      {/* Footer - clean, advanced with infinite animated background */}
      <footer className="relative overflow-hidden bg-slate-900 text-slate-100">
        {/* animated background blobs */}
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="blob bg-orange-600/20" style={{left: '-10%', top: '-20%', width: '480px', height: '480px'}}></div>
          <div className="blob bg-amber-400/10" style={{right: '-20%', bottom: '-10%', width: '640px', height: '640px'}}></div>
          <div className="blob bg-indigo-600/5" style={{left: '30%', bottom: '-10%', width: '420px', height: '420px'}}></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                      <img
                        src="/img/footer logo.png"
                        alt="Dhruv Library Logo"
                        className="footer-logo w-22 h-22 md:w-20 md:h-20 object-contain glow"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      />
                </div>
                <div>
                  <div className="text-2xl font-serif font-bold">DHRUV LIBRARY</div>
                  <div className="text-sm text-amber-200">Empowering Meerut's Future Since 2022</div>
                </div>
              </div>
              <p className="text-sm text-slate-200/90 max-w-md">Dhruv Library provides a focused, resource-rich environment to help students excel academically and professionally. Join our community to access study spaces, curated materials, and mentorship.</p>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-semibold text-amber-200 uppercase tracking-wider">Quick links</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <a href="#" onClick={() => navigateTo('home')} className="hover:text-amber-200">Home</a>
                <a href="#about" onClick={() => navigateTo('about')} className="hover:text-amber-200">About</a>
                <a href="#facilities" onClick={() => navigateTo('facilities')} className="hover:text-amber-200">Facilities</a>
                <a href="#gallery" onClick={() => navigateTo('gallery')} className="hover:text-amber-200">Gallery</a>
                <a href="#contact" onClick={() => navigateTo('contact')} className="hover:text-amber-200">Contact</a>
                <a href="#trophy-winners" className="hover:text-amber-200">Trophy Winners</a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-amber-200 uppercase tracking-wider mb-3">Get in touch</h4>
              <p className="text-sm">Have questions or want to join? Reach us at:</p>
              <a href="mailto:Dhruvlibrary2022@gmail.com" className="block mt-3 text-lg font-medium text-white hover:underline">Dhruvlibrary2022@gmail.com</a>

              <div className="mt-6">
                <label className="block text-xs text-amber-200 mb-2">Subscribe to our newsletter</label>
                <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                  <input className="flex-1 px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm placeholder-slate-300" placeholder="Your email" />
                  <button className="px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded-md text-sm font-semibold">Subscribe</button>
                </form>
              </div>
            </div>
          </div>

            <div className="mt-12 border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-200">
            <div>© 2022    Dhruv Library. All Rights Reserved.</div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-amber-200"><Facebook size={18} /></a>
              <a href="#" className="hover:text-amber-200"><Instagram size={18} /></a>
              <a href="#" className="hover:text-amber-200"><Twitter size={18} /></a>
              <a href="mailto:Dhruvlibrary2022@gmail.com" className="hover:text-amber-200 flex items-center gap-2"><Mail size={16} /> Email us</a>
            </div>
          </div>
        </div>

        <style>{`
          .blob{ position:absolute; border-radius:999px; filter: blur(40px); opacity:0.9; transform: translate3d(0,0,0); animation: blobMove 12s ease-in-out infinite; }
          .blob:nth-child(1){ animation-delay: 0s }
          .blob:nth-child(2){ animation-delay: 3s }
          .blob:nth-child(3){ animation-delay: 6s }
          @keyframes blobMove{
            0%{ transform: translateY(0) scale(1); }
            33%{ transform: translateY(-20px) scale(1.05) translateX(10px); }
            66%{ transform: translateY(10px) scale(0.95) translateX(-10px); }
            100%{ transform: translateY(0) scale(1); }
          }

          /* Nav double-underline hover effect */
          .nav-link{ position: relative; display: inline-block; padding-top: 6px; padding-bottom: 6px; }
          .nav-link::before, .nav-link::after{ content: ''; position: absolute; left: 0; right: 0; height: 3px; transform: scaleX(0); transition: transform 260ms cubic-bezier(.2,.9,.2,1); border-radius: 3px; }
          .nav-link::before{ top: 0; background: linear-gradient(90deg, rgba(249,115,22,1), rgba(254,202,21,1)); transform-origin: left; }
          .nav-link::after{ bottom: 0; background: linear-gradient(90deg, rgba(254,202,21,1), rgba(249,115,22,1)); transform-origin: right; }
          .nav-link:hover::before, .nav-link:focus::before, .nav-link:focus-visible::before{ transform: scaleX(1); }
          .nav-link:hover::after, .nav-link:focus::after, .nav-link:focus-visible::after{ transform: scaleX(1); }
          .nav-link:focus{ outline: none; }
          /* Footer logo glow */
          .footer-logo{ border-radius: 999px; background: transparent; display: inline-block; }
          .footer-logo{ box-shadow: 0 6px 18px rgba(255,140,0,0.08); transition: box-shadow 320ms ease, transform 320ms ease; }
          .footer-logo:hover{ transform: translateY(-2px) scale(1.02); box-shadow: 0 18px 48px rgba(255,140,0,0.18); }
          .footer-logo.glow{ animation: footerGlow 3.6s ease-in-out infinite; }
          @keyframes footerGlow{
            0%{ box-shadow: 0 0 0px rgba(255,159,67,0); }
            40%{ box-shadow: 0 0 24px rgba(255,159,67,0.16); }
            60%{ box-shadow: 0 0 18px rgba(255,159,67,0.12); }
            100%{ box-shadow: 0 0 0px rgba(255,159,67,0); }
          }
          /* Footer link focus for keyboard users */
          footer a:focus-visible{ outline: 3px solid rgba(255,159,67,0.18); outline-offset: 3px; border-radius: 6px; }
        `}</style>
      </footer>
  {/* Site-wide CTA buttons */}
      <AdvancedCTA
        whatsapp="919456446015"
        phone="919456446015"
        mail="dhruvlibrary2022@gmail.com"
        mailBody={"Hello,\n\nI’m interested in Dhruv Library and would like more information about membership and timings.\n\nThanks,\n[Your Name]"}
        visible={!isLoading && !showNavLoader}
      />

  {/* Site-wide chat assistant */}
  <ChatWidget />
    </div>
  );
};

export default App;