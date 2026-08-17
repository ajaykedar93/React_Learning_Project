import React, { useState } from "react";
import profileImage from "../assets/ajay-profile.jpg";
// Replace Resume.jpg later if you rename the file.
import resumeImage from "../assets/ajay_resume.png";

/**
 * Portfolio.jsx
 * Professional responsive portfolio for Ajay Kedar
 * React + JSX — no external CSS or icon package required.
 */

// Personal / contact information used across the portfolio.
const profile = {
  name: "Ajay Kedar",
  role: "MCA • Full-Stack Developer",
  location: "Nashik, Maharashtra, India",
  availability: "Open to Software Development Opportunities",
  email: "ajaykedar3790@gmail.com",
  phone: "9146963805",
  alternatePhone: "9370470095",
  github: "https://github.com/ajaykedar93",
  linkedin: "https://www.linkedin.com/in/ajaykedar93/",
  instagram: "https://www.instagram.com/ajay_kedar_1/",
  dob: "16 April 2002",
  address: "Savalvihir Bk, Shirdi, Taluka Rahata, District Ahilyanagar, Maharashtra – 423109",
};

// Main technical skills and visual proficiency values.
const skills = [
  ["React.js", "Advanced", 90],
  ["JavaScript", "Advanced", 88],
  ["Node.js", "Advanced", 87],
  ["Express.js", "Advanced", 86],
  ["PostgreSQL", "Strong", 83],
  ["HTML", "Advanced", 94],
  ["CSS", "Advanced", 92],
  ["Bootstrap", "Strong", 86],
  ["Supabase", "Strong", 80],
  ["REST APIs", "Strong", 84],
];

// Technology badges shown in the technical toolkit.
const technologies = [
  "React.js", "JavaScript", "JSX", "Node.js", "Express.js",
  "PostgreSQL", "Supabase", "REST API", "Git", "GitHub",
  "HTML", "CSS", "Bootstrap", "Vercel", "Render",
  "Android Studio", "WebView", "AI Integration", "Connectivity Integration"
];

// Supporting tools, deployment and integration knowledge.
const additionalSkills = [
  ["Android Studio", "WebView-based Android app development"],
  ["Hosting & Deployment", "Vercel, Render, domain and server setup"],
  ["Software Tools", "MS Excel, PowerPoint, TallyPrime and other productivity software"],
  ["Integration", "API connectivity, third-party service integration and application workflows"],
  ["AI Knowledge", "AI-assisted development, AI tools and practical AI integration concepts"],
];

const learningFocus = [
  ["Continuous Learning", "Actively exploring new frameworks, tools and development practices to keep technical skills current."],
  ["AI & Intelligent Tools", "Practical understanding of AI-assisted development, prompt-driven workflows and integrating AI capabilities into applications."],
  ["Logical Thinking", "Breaking complex requirements into clear steps, evaluating solutions and selecting practical implementation approaches."],
  ["Problem Solving", "Debugging systematically, identifying root causes and improving application reliability, usability and performance."],
  ["Technical Adaptability", "Quickly learning unfamiliar technologies and connecting new tools with existing React, Node.js, APIs and database workflows."],
  ["Product Thinking", "Focusing on useful user experiences, maintainable code, security-aware workflows and real-world application needs."]
];

// Portfolio projects. Keep descriptions complete; CSS allows text to wrap on small screens.
const projects = [
  {
    number: "01",
    title: "Kondaji Chiwda — Nashik",
    category: "Internship • Real-World Project",
    description:
      "Worked on a real-world web application project during my internship at Enginuspark Technology, Nashik. Contributed to responsive frontend development and backend integration using React, Node.js and Express.js.",
    stack: ["React", "Node.js", "Express.js", "REST API"],
    meta: "Enginuspark Technology • Nashik",
    problem: "A practical business web project requiring a responsive user-facing experience and connected backend workflows.",
    solution: "Contributed to the frontend and backend integration to turn the business requirements into a usable web application.",
    icon: "store",
  },
  {
    number: "02",
    title: "Telegram-Style Chat & Notes Platform",
    category: "Full-Stack • Communication",
    description:
      "A Telegram-inspired communication platform with real-time-style chat workflows, notes, media and file sharing, user profiles, public/private channels, member management and private-channel access controls.",
    stack: ["React", "Node.js", "Express.js", "PostgreSQL", "Supabase"],
    meta: "Frontend: Vercel • Backend: Render • Cloud DB: Supabase",
    problem: "Users need a structured space for chats, notes, files, profiles and controlled public/private channels.",
    solution: "Built a full-stack communication workflow with channel controls, media/file handling, PostgreSQL and Supabase-backed data.",
    icon: "chat",
  },
  {
    number: "03",
    title: "QR-Based Private Document Transfer",
    category: "Security • Document System",
    description:
      "A document sharing concept where a sender creates a private QR image for a document and the receiver scans the QR to securely access the same document. Designed to avoid sending the actual QR image or document through email or WhatsApp as the transfer mechanism.",
    stack: ["React", "Node.js", "Express.js", "PostgreSQL", "QR"],
    meta: "Private document access workflow",
    problem: "A private document must be accessed by the intended receiver without using email or WhatsApp as the transfer mechanism.",
    solution: "Designed a QR-based access workflow where the receiver scans the generated QR and reaches the same protected document.",
    icon: "qr",
  },
  {
    number: "04",
    title: "Campus Placement Drive System",
    category: "College • Recruitment Platform",
    description:
      "A campus recruitment platform where companies register and publish jobs, colleges verify opportunities, eligible students apply, and aptitude tests and interview workflows can be managed online through a structured placement process.",
    stack: ["React", "Node.js", "Express.js", "PostgreSQL"],
    meta: "Company • College • Student workflow",
    problem: "Campus recruitment involves multiple parties and several stages that need one structured workflow.",
    solution: "Created a system concept connecting company registration, college verification, student applications, aptitude tests and interviews.",
    icon: "campus",
  },
];

// Academic history shown in chronological timeline order.
const education = [
  {
    period: "2025",
    title: "Master of Computer Applications (MCA)",
    subtitle: "MET Bhujbal Knowledge City, Nashik",
    description: "MCA with practical exposure to software development, web technologies, databases, application integration and modern deployment workflows.",
  },
  {
    period: "2023",
    title: "Bachelor of Computer Science (BCS)",
    subtitle: "K. J. Somaiya College, Kopargaon",
    description: "Graduation in Computer Science with a foundation in programming, databases, software concepts and computer applications.",
  },
  {
    period: "2020",
    title: "Higher Secondary Certificate (HSC)",
    subtitle: "Shree Saibaba Junior College, Shirdi",
    description: "Higher secondary education completed in 2020.",
  },
  {
    period: "2018",
    title: "Secondary School Certificate (SSC)",
    subtitle: "New English School, Savalvihir Bk",
    description: "Secondary school education completed in 2018.",
  },
];

// Key professional strengths displayed in the About section.
const strengths = [
  "MERN stack application development",
  "REST API design and integration",
  "PostgreSQL database architecture",
  "Responsive UI development",
  "Server, hosting and domain workflows",
  "WebView Android app development",
  "API connectivity and software integration",
  "Problem solving and debugging",
];

// Reusable inline SVG icon component keeps the project dependency-free.
function Icon({ name, size = 20 }) {
  const common = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.8,
    strokeLinecap: "round", strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const p = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></>,
    code: <><path d="m8 9-4 3 4 3"/><path d="m16 9 4 3-4 3"/><path d="m14 5-4 14"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    phone: <><path d="M7 3h3l2 5-2 2a14 14 0 0 0 4 4l2-2 5 2v3c0 1-1 2-2 2C10 19 5 14 5 5c0-1 1-2 2-2Z"/></>,
    github: <><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.5-.4 7-1.7 7-7A5.4 5.4 0 0 0 20 4a5 5 0 0 0-.1-3.5S18.7.1 15 2.5a13.5 13.5 0 0 0-6 0C5.3.1 4.1.5 4.1.5A5 5 0 0 0 4 4a5.4 5.4 0 0 0-1 3.5c0 5.3 3.5 6.6 7 7A4.8 4.8 0 0 0 9 18v4"/><path d="M9 18c-4.5 2-4.5-2-6.5-2"/></>,
    linkedin: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></>,
    external: <><path d="M14 4h6v6"/><path d="m20 4-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></>,
    menu: <><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    map: <><circle cx="12" cy="10" r="3"/><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    store: <><path d="M4 10h16"/><path d="M5 10v9h14v-9"/><path d="M3 10 5 4h14l2 6"/><path d="M9 19v-5h6v5"/></>,
    chat: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-4-.9L4 20l1.2-3.5A7.3 7.3 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7Z"/><path d="M8 11h8M8 14h5"/></>,
    qr: <><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h3v3h3v3M14 20v-3M17 14h3"/></>,
    campus: <><path d="m3 10 9-5 9 5-9 5-9-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/><path d="M21 10v7"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></>,
    react: <><circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)"/></>,
    node: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M8 9.5 12 12l4-2.5M12 12v5"/></>,
    express: <><path d="M4 18h16M5 6h14M7 12h10"/><path d="M4 6h1M19 6h1"/></>,
    database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 2 16 2 16 0V5"/><path d="M4 12v7c0 2 16 2 16 0v-7"/></>,
    api: <><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/></>,
    qrSmall: <><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h3v3h3v3M14 20v-3"/></>,
  };
  return <svg {...common}>{p[name]}</svg>;
}

function SocialIcon({ type }) {
  return <Icon name={type} size={18} />;
}

function TechIcon({ tech }) {
  const key = tech === "React" ? "react"
    : tech === "Node.js" ? "node"
    : tech === "Express.js" ? "express"
    : tech === "PostgreSQL" || tech === "Supabase" ? "database"
    : tech === "REST API" ? "api"
    : tech === "QR" ? "qrSmall"
    : null;
  return key ? <Icon name={key} size={12}/> : null;
}

// Main single-page portfolio component.
export default function Portfolio() {
  const [menuOpen, setMenuOpen] = useState(false);
  // Controls the centered resume preview modal.
  const [resumePreviewOpen, setResumePreviewOpen] = useState(false);
  // Tracks the section selected from the navigation for an active visual state.
  const [activeSection, setActiveSection] = useState("home");
  // UI state for the top scroll progress and floating back-to-top control.
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackTop, setShowBackTop] = useState(false);

  // Close the resume preview with the Escape key.
  React.useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") setResumePreviewOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  // Smoothly move to a section and highlight the selected navigation item.
  const go = (id) => {
    setMenuOpen(false);
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Update the top progress indicator while the visitor scrolls.
  React.useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
      setScrollProgress(progress);
      setShowBackTop(window.scrollY > 520);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Return to the top with the same smooth scrolling used by the navigation.
  const backToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="portfolio-app">
      <div className="scroll-progress" style={{width:`${scrollProgress}%`}} aria-hidden="true"/>
      <style>{`
        :root {
          --bg:#030712; --bg2:#07111f; --panel:rgba(11,18,32,.78);
          --line:rgba(148,163,184,.16); --text:#f8fafc; --muted:#9aa9bd;
          --blue:#8b5cf6; --cyan:#22d3ee; --green:#34d399; --purple:#7c3aed;
          --pink:#f472b6; --gold:#fbbf24; --max:1180px;
        }
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;overflow-x:hidden}
        .portfolio-app,.container,.section,.project,.timeline-card,.contact,.contact-link,.about-copy,.quick-item,.tech-cloud{min-width:0}
        .project h3,.project p,.project-meta,.timeline-card h3,.timeline-card h4,.timeline-card p,.contact-link span,.quick-item span{
          overflow-wrap:anywhere;word-break:normal
        }
        a{color:inherit;text-decoration:none}
        button{font:inherit} button,a,.tech,.project{cursor:pointer}
        .portfolio-app{min-height:100vh;overflow-x:hidden;background:
          radial-gradient(circle at 82% 2%,rgba(139,92,246,.22),transparent 30rem),
          radial-gradient(circle at 4% 28%,rgba(34,211,238,.11),transparent 26rem),
          radial-gradient(circle at 88% 72%,rgba(52,211,153,.09),transparent 28rem),
          linear-gradient(135deg,#020617 0%,#050816 48%,#070817 100%);
          background-attachment:fixed}
        .container{width:min(calc(100% - 40px),var(--max));margin:auto}
        .section{padding:105px 0;scroll-margin-top:78px}
        .navbar{position:fixed;inset:0 0 auto;z-index:100;border-bottom:1px solid var(--line);
          background:rgba(5,8,22,.78);backdrop-filter:blur(18px)}
        .nav-inner{height:74px;display:flex;align-items:center;justify-content:space-between}
        .brand{display:flex;align-items:center;gap:10px;border:0;background:none;color:white;cursor:pointer;font-weight:900;font-size:16px}
        .brand-mark{width:39px;height:39px;border-radius:12px;display:grid;place-items:center;
          background:linear-gradient(135deg,var(--blue),var(--cyan));color:#04111e;box-shadow:0 10px 30px rgba(34,211,238,.18)}
        .brand span:last-child{color:var(--muted)}
        .nav-links{display:flex;align-items:center;gap:8px}
        .nav-links button{border:0;background:transparent;color:#cbd5e1;padding:10px 12px;border-radius:9px;cursor:pointer;font-size:13px;font-weight:750}
        .nav-links button:hover{
          background:linear-gradient(135deg,rgba(139,92,246,.16),rgba(6,182,212,.12));
          color:#fff;transform:translateY(-1px)
        }
        .nav-links button.active{
          color:#fff;background:linear-gradient(135deg,rgba(139,92,246,.28),rgba(6,182,212,.18));
          box-shadow:inset 0 -2px 0 var(--cyan),0 7px 22px rgba(6,182,212,.08)
        }
        .nav-cta{background:#f8fafc!important;color:#07101c!important}
        .mobile-menu{display:none;border:0;background:transparent;color:white;cursor:pointer}
        .hero{min-height:100vh;padding:155px 0 85px;display:flex;align-items:center}
        .hero-grid{display:grid;grid-template-columns:1.18fr .82fr;gap:75px;align-items:center}
        .scroll-progress{
          position:fixed;left:0;top:0;height:3px;z-index:1000;
          background:linear-gradient(90deg,#7c3aed,#06b6d4,#10b981);
          box-shadow:0 0 14px rgba(6,182,212,.45);transition:width .08s linear
        }
        .internship-badge{
          display:inline-flex;align-items:center;gap:8px;margin:-8px 0 22px;
          padding:8px 12px;border:1px solid rgba(139,92,246,.25);border-radius:999px;
          background:linear-gradient(135deg,rgba(139,92,246,.12),rgba(16,185,129,.08));
          color:#ddd6fe;font-size:11px;font-weight:850
        }
        .social-btn{gap:8px}
        .github-btn{color:#f8fafc;background:rgba(255,255,255,.045)}
        .linkedin-btn{color:#7dd3fc;background:rgba(10,102,194,.10)}
        .status{display:inline-flex;align-items:center;gap:9px;padding:8px 12px;border:1px solid rgba(52,211,153,.25);
          background:rgba(52,211,153,.06);color:#a7f3d0;border-radius:999px;font-size:12px;font-weight:800;margin-bottom:22px}
        .status-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 15px var(--green)}
        .hero h1{margin:0;max-width:850px;font-size:clamp(48px,7vw,84px);line-height:.98;letter-spacing:-.065em}
        .accent{background:linear-gradient(110deg,#fff,var(--blue) 45%,var(--cyan));-webkit-background-clip:text;background-clip:text;color:transparent}
        .hero-lead{max-width:700px;color:#a9b6c9;font-size:18px;line-height:1.8;margin:26px 0 30px}
        .hero-actions{display:flex;flex-wrap:wrap;gap:11px}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:46px;padding:0 17px;
          border-radius:11px;border:1px solid var(--line);cursor:pointer;font-weight:800;font-size:13px;transition:.22s}
        .btn:hover{
          transform:translateY(-3px);box-shadow:0 12px 28px rgba(6,182,212,.12)
        }
        .btn:focus-visible,.nav-links button:focus-visible,.social:focus-visible,.contact-link:focus-visible{
          outline:2px solid var(--cyan);outline-offset:3px
        }
        .btn-primary{background:#f8fafc;color:#07101c;border-color:#f8fafc}
        .btn-secondary{background:rgba(15,23,42,.7);color:#e2e8f0}
        .btn-resume{background:linear-gradient(135deg,#7c3aed 0%,#2563eb 48%,#0891b2 100%);color:#fff;border-color:rgba(255,255,255,.16);
          box-shadow:0 12px 32px rgba(124,58,237,.25),inset 0 1px 0 rgba(255,255,255,.12)}
        .btn-preview{
          background:linear-gradient(135deg,rgba(139,92,246,.13),rgba(6,182,212,.10));
          color:#dbeafe;border-color:rgba(96,165,250,.28)
        }
        .btn-preview:hover{
          border-color:rgba(34,211,238,.55);
          box-shadow:0 12px 30px rgba(34,211,238,.12)
        }
        .resume-modal{
          position:fixed;inset:0;z-index:500;display:flex;align-items:center;justify-content:center;
          padding:24px;background:rgba(1,4,12,.82);backdrop-filter:blur(14px);
          animation:resumeFadeIn .22s ease both
        }
        .resume-modal-card{
          position:relative;width:min(92vw,860px);max-height:94vh;padding:14px;
          border:1px solid rgba(255,255,255,.28);border-radius:20px;
          background:linear-gradient(145deg,rgba(15,23,42,.98),rgba(5,8,22,.98));
          box-shadow:0 30px 100px rgba(0,0,0,.58),0 0 0 1px rgba(139,92,246,.12);
          animation:resumeScaleIn .25s ease both
        }
        .resume-modal-title{
          padding:3px 52px 12px 6px;color:#e2e8f0;font-size:13px;font-weight:850;
          letter-spacing:.04em
        }
        .resume-image-wrap{
          width:100%;max-height:calc(94vh - 70px);overflow:auto;border-radius:13px;
          background:#111827;text-align:center
        }
        .resume-preview-image{
          display:block;width:100%;height:auto;max-width:100%;margin:auto
        }
        .resume-modal-close{
          position:absolute;top:11px;right:11px;z-index:2;width:38px;height:38px;
          display:grid;place-items:center;border:1px solid rgba(255,255,255,.18);border-radius:10px;
          background:rgba(15,23,42,.88);color:#f8fafc;cursor:pointer;transition:.2s
        }
        .resume-modal-close:hover{
          background:#7c3aed;border-color:#a78bfa;transform:rotate(4deg) scale(1.04)
        }
        .additional-skills-grid{
          display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px
        }
        .additional-skill-card{
          min-width:0;height:100%;padding:23px;border:1px solid rgba(139,92,246,.18);
          border-radius:16px;background:linear-gradient(145deg,rgba(139,92,246,.07),rgba(6,182,212,.04));
          transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease
        }
        .additional-skill-card:hover{
          transform:translateY(-5px);border-color:rgba(6,182,212,.38);
          box-shadow:0 16px 35px rgba(6,182,212,.08)
        }
        .additional-skill-card h3{overflow-wrap:anywhere}
        .additional-skill-card p{overflow-wrap:anywhere;line-height:1.75}
        .learning-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        .learning-card{
          position:relative;min-width:0;overflow:hidden;padding:23px;border:1px solid rgba(34,211,238,.16);
          border-radius:17px;background:
            radial-gradient(circle at 100% 0,rgba(139,92,246,.12),transparent 13rem),
            linear-gradient(145deg,rgba(15,23,42,.82),rgba(7,12,23,.72));
          box-shadow:0 12px 35px rgba(0,0,0,.12);
          transition:transform .28s ease,border-color .28s ease,box-shadow .28s ease;
        }
        .learning-card:before{
          content:"";position:absolute;left:0;top:0;width:100%;height:2px;
          background:linear-gradient(90deg,var(--purple),var(--cyan),var(--green));
        }
        .learning-card:hover{
          transform:translateY(-6px);border-color:rgba(34,211,238,.34);
          box-shadow:0 20px 48px rgba(0,0,0,.22),0 0 28px rgba(34,211,238,.06);
        }
        .learning-icon{
          width:40px;height:40px;display:grid;place-items:center;border-radius:12px;margin-bottom:16px;
          color:#67e8f9;background:linear-gradient(135deg,rgba(139,92,246,.16),rgba(34,211,238,.10));
          border:1px solid rgba(34,211,238,.16);
        }
        .learning-card h3{margin:0 0 8px;font-size:16px;letter-spacing:-.02em}
        .learning-card p{margin:0;color:var(--muted);font-size:13px;line-height:1.75;overflow-wrap:anywhere}
        .learning-badge{
          display:inline-flex;align-items:center;gap:7px;margin-bottom:25px;padding:7px 10px;border-radius:999px;
          border:1px solid rgba(52,211,153,.18);background:rgba(52,211,153,.06);color:#a7f3d0;
          font-size:10px;font-weight:850;
        }
        @keyframes resumeFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes resumeScaleIn{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .hero-meta{display:flex;flex-wrap:wrap;gap:19px;margin-top:28px;color:var(--muted);font-size:13px}
        .hero-meta span{display:inline-flex;align-items:center;gap:7px}
        .profile-frame{
          padding:6px;border:1px solid rgba(255,255,255,.72);border-radius:31px;
          background:rgba(255,255,255,.035);box-shadow:0 0 0 1px rgba(255,255,255,.05),0 24px 70px rgba(0,0,0,.22)
        }
        .hero-card{position:relative;padding:30px;border:1px solid rgba(139,92,246,.24);border-radius:26px;
          background:linear-gradient(145deg,rgba(17,28,47,.94),rgba(8,13,24,.82));box-shadow:0 30px 80px rgba(0,0,0,.25);overflow:hidden}
        .hero-card:before{content:"";position:absolute;width:230px;height:230px;border-radius:50%;background:rgba(96,165,250,.14);filter:blur(10px);top:-100px;right:-80px}
        .avatar{width:118px;height:118px;border-radius:28px;display:grid;place-items:center;background:linear-gradient(135deg,#172554,#0e7490);
          border:1px solid rgba(125,211,252,.22);font-size:42px;font-weight:950;color:white;position:relative;overflow:hidden;box-shadow:0 18px 45px rgba(34,211,238,.16)}
        .avatar img{width:100%;height:100%;object-fit:cover;display:block}
        .hero-card h3{margin:25px 0 7px;font-size:27px;letter-spacing:-.035em}
        .hero-card-role{color:var(--blue);font-weight:800;font-size:14px}
        .hero-card-line{height:1px;background:var(--line);margin:23px 0}
        .quick-list{display:grid;gap:14px}
        .quick-item{display:flex;justify-content:space-between;gap:15px;font-size:13px}
        .quick-item span:first-child{color:var(--muted)}
        .quick-item span:last-child{text-align:right;color:#e2e8f0}
        .social-row{display:flex;gap:9px;margin-top:22px}
        .social{width:39px;height:39px;border-radius:11px;display:grid;place-items:center;border:1px solid var(--line);transition:.2s}
        .social:hover{transform:translateY(-3px)}
        .github{color:#f8fafc;background:rgba(255,255,255,.05)}
        .linkedin{color:#0a66c2;background:rgba(10,102,194,.08)}
        .instagram{color:#e1306c;background:rgba(225,48,108,.08)}
        .email-brand{color:#ea4335;background:rgba(234,67,53,.08)}
        .phone-brand{color:#22c55e;background:rgba(34,197,94,.08)}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);border-radius:18px;overflow:hidden;background:rgba(15,23,42,.5)}
        .stat{padding:23px;border-right:1px solid var(--line)}
        .stat:last-child{border-right:0}
        .stat strong{display:block;font-size:25px}
        .stat span{display:block;margin-top:5px;color:var(--muted);font-size:12px}
        .section-heading{max-width:730px;margin-bottom:45px}
        .eyebrow{color:#a78bfa;font-size:11px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;margin-bottom:12px;text-shadow:0 0 18px rgba(167,139,250,.18)}
        .section-heading h2{margin:0;font-size:clamp(32px,5vw,52px);line-height:1.05;letter-spacing:-.045em}
        .section-heading p{margin:17px 0 0;color:var(--muted);font-size:16px;line-height:1.8}
        .about-grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:65px}
        .about-copy{color:#a9b6c9;line-height:1.85;font-size:16px}
        .about-copy p{margin:0 0 18px}
        .strengths{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .strength{display:flex;align-items:flex-start;gap:10px;padding:15px;border:1px solid var(--line);border-radius:12px;background:rgba(15,23,42,.42);color:#cbd5e1;font-size:13px;line-height:1.5}
        .check{color:var(--green);flex:0 0 auto}
        .timeline{position:relative;display:grid;gap:18px}
        .timeline:before{content:"";position:absolute;left:10px;top:12px;bottom:12px;width:1px;background:var(--line)}
        .timeline-item{position:relative;padding-left:40px}
        .timeline-dot{position:absolute;left:4px;top:8px;width:13px;height:13px;border-radius:50%;background:var(--blue);box-shadow:0 0 0 5px rgba(96,165,250,.1)}
        .timeline-card{padding:24px;border:1px solid var(--line);border-radius:16px;background:rgba(15,23,42,.48)}
        .period{color:var(--blue);font-size:11px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
        .timeline-card h3{margin:8px 0 5px;font-size:20px}
        .timeline-card h4{margin:0 0 12px;color:#cbd5e1;font-size:13px}
        .timeline-card p{margin:0;color:var(--muted);line-height:1.7;font-size:14px}
        .experience-card{
          position:relative;overflow:hidden;padding:30px;border:1px solid rgba(139,92,246,.28);
          border-radius:20px;background:
            radial-gradient(circle at 100% 0,rgba(124,58,237,.13),transparent 20rem),
            linear-gradient(145deg,rgba(17,28,47,.82),rgba(8,13,24,.72));
          box-shadow:0 18px 55px rgba(0,0,0,.18);
        }
        .experience-card:before{
          content:"";position:absolute;left:0;top:0;bottom:0;width:3px;
          background:linear-gradient(180deg,var(--purple),var(--cyan),var(--green));
        }
        .experience-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}
        .experience-role{margin:0;font-size:27px;line-height:1.15;letter-spacing:-.035em}
        .experience-company{margin:8px 0 0;color:#c4b5fd;font-size:14px;font-weight:800}
        .experience-date{
          flex:0 0 auto;padding:9px 13px;border:1px solid rgba(139,92,246,.24);
          border-radius:999px;background:rgba(139,92,246,.08);color:#ddd6fe;
          font-size:11px;font-weight:850;white-space:nowrap;
        }
        .experience-location{
          display:flex;align-items:center;gap:8px;margin:22px 0 20px;color:#94a3b8;
          font-size:13px;font-weight:700;
        }
        .experience-list{display:grid;gap:12px;margin:0;padding:0;list-style:none}
        .experience-list li{position:relative;padding-left:22px;color:#a9b6c9;font-size:14px;line-height:1.8}
        .experience-list li:before{
          content:"";position:absolute;left:4px;top:.78em;width:7px;height:7px;border-radius:50%;
          background:var(--cyan);box-shadow:0 0 12px rgba(6,182,212,.35);
        }
        .experience-stack{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
        .experience-stack span{
          padding:6px 9px;border-radius:7px;border:1px solid rgba(6,182,212,.16);
          background:rgba(6,182,212,.06);color:#bae6fd;font-size:10px;font-weight:850;
        }
        .project-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
        .project{position:relative;min-height:405px;padding:27px;border:1px solid rgba(59,130,246,.55);border-radius:19px;
          background:linear-gradient(150deg,rgba(17,28,47,.82),rgba(10,15,26,.68));
          display:flex;flex-direction:column;transition:transform .28s ease,border-color .28s ease,box-shadow .28s ease;overflow:hidden}
        .project:after{
          content:"View Project  →";position:absolute;right:18px;top:18px;padding:7px 10px;border-radius:999px;
          color:#dbeafe;background:rgba(37,99,235,.14);border:1px solid rgba(59,130,246,.35);
          font-size:10px;font-weight:900;letter-spacing:.04em;opacity:0;transform:translateY(-5px);
          transition:.25s ease;pointer-events:none
        }
        .project:hover{
          transform:translateY(-7px);border-color:#3b82f6;
          box-shadow:0 18px 50px rgba(37,99,235,.16),0 0 0 1px rgba(59,130,246,.12)
        }
        .project:hover:after{opacity:1;transform:translateY(0)}
        .project-top{display:flex;justify-content:space-between;align-items:flex-start}
        .project-number{color:#475569;font-size:34px;font-weight:950;letter-spacing:-.06em}
        .project-icon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;color:var(--cyan);background:rgba(34,211,238,.08);border:1px solid rgba(34,211,238,.13)}
        .project-category{color:var(--blue);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;margin-top:23px}
        .project h3{margin:8px 0 12px;font-size:22px;letter-spacing:-.035em}
        .project p{color:var(--muted);font-size:14px;line-height:1.75;margin:0}
        .project-bottom{margin-top:auto}
        .project-insight{display:grid;gap:9px;margin-top:18px}
        .project-insight>div{display:grid;gap:3px;padding:9px 10px;border-left:2px solid rgba(6,182,212,.42);border-radius:0 8px 8px 0;background:rgba(6,182,212,.035)}
        .project-insight strong{font-size:9px;color:#67e8f9;text-transform:uppercase;letter-spacing:.12em}
        .project-insight span{font-size:11px;line-height:1.55;color:#94a3b8}
        .chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:17px}
        .chip{display:inline-flex;align-items:center;gap:6px;padding:6px 9px;border-radius:7px;background:rgba(139,92,246,.09);color:#ddd6fe;border:1px solid rgba(139,92,246,.14);font-size:10px;font-weight:800}
        .project-meta{display:flex;align-items:center;gap:7px;margin-top:17px;color:#64748b;font-size:11px;font-weight:750}
        .skills-grid{display:grid;grid-template-columns:1fr 1fr;gap:55px}
        .skill-list{display:grid;gap:19px;padding:22px;border:1px solid rgba(139,92,246,.14);border-radius:18px;background:linear-gradient(145deg,rgba(139,92,246,.06),rgba(6,182,212,.04))}
        .skill-head{display:flex;justify-content:space-between;margin-bottom:8px}
        .skill-head span:first-child{font-size:13px;font-weight:800}
        .skill-head span:last-child{font-size:11px;color:var(--muted)}
        .bar{height:6px;border-radius:999px;background:#172033;overflow:hidden}
        .bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--purple),var(--cyan),var(--green));box-shadow:0 0 14px rgba(6,182,212,.18)}
        .tech-cloud{display:flex;flex-wrap:wrap;gap:10px}
        .tech{padding:11px 14px;border:1px solid rgba(139,92,246,.18);border-radius:12px;color:#ede9fe;
          background:linear-gradient(135deg,rgba(139,92,246,.12),rgba(6,182,212,.07));font-size:12px;font-weight:850;
          box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 8px 24px rgba(0,0,0,.08);transition:.22s}
        .tech:hover{transform:translateY(-3px);border-color:rgba(6,182,212,.38);color:#fff;
          box-shadow:0 12px 28px rgba(6,182,212,.12)}
        .contact{padding:65px;border:1px solid rgba(96,165,250,.18);border-radius:25px;background:radial-gradient(circle at 100% 0,rgba(96,165,250,.13),transparent 32rem),rgba(15,23,42,.6);
          display:grid;grid-template-columns:1.1fr .9fr;gap:55px;align-items:center}
        .contact h2{margin:0;font-size:clamp(32px,5vw,54px);letter-spacing:-.05em}
        .contact p{color:var(--muted);line-height:1.8;max-width:650px}
        .contact-links{display:grid;gap:10px}
        .contact-link{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--line);border-radius:11px;background:rgba(7,11,20,.35);color:#cbd5e1;font-size:13px;font-weight:700;transition:.2s}
        .contact-link:hover{border-color:rgba(96,165,250,.3);color:white;transform:translateX(2px)}
        .contact-link .brand-icon{margin-left:auto;display:grid;place-items:center}
        .footer{
          padding:26px 0;border-top:1px solid rgba(148,163,184,.12);
          color:#718096;font-size:14px;
          background:linear-gradient(180deg,rgba(5,8,22,.18),rgba(5,8,22,.72))
        }
        .footer-inner{
          display:flex;align-items:center;justify-content:center;
          min-height:34px;text-align:center
        }
        .footer-inner>span{
          display:inline-flex;align-items:center;justify-content:center;gap:8px;
          max-width:100%;color:#64748b;line-height:1.5;white-space:normal;
          overflow-wrap:anywhere;word-break:normal;text-align:center;
          transition:color .25s ease,transform .25s ease
        }
        .footer-inner>span:hover{color:#a5b4fc;transform:translateY(-1px)}
        .footer strong{color:#cbd5e1;font-weight:850}
        .footer b{color:#22d3ee;font-weight:850;text-shadow:0 0 16px rgba(34,211,238,.16)}
        .footer i{color:#8b5cf6;font-style:normal;font-weight:900}
        .back-top{
          position:fixed;right:24px;bottom:24px;z-index:90;width:46px;height:46px;border-radius:14px;
          border:1px solid rgba(6,182,212,.35);background:linear-gradient(135deg,#172554,#0e7490);
          color:#fff;display:grid;place-items:center;cursor:pointer;font-size:20px;font-weight:900;
          box-shadow:0 14px 35px rgba(0,0,0,.28);transition:.25s
        }
        .back-top:hover{transform:translateY(-5px);box-shadow:0 18px 38px rgba(6,182,212,.18)}

        .hero-card,.project,.timeline-card,.contact,.stats{animation:riseIn .7s ease both}
        .hero-card,.project,.timeline-card,.contact,.additional-skill-card,.skill-list{
          position:relative;
        }
        .hero-card:after,.project:before,.timeline-card:after,.contact:after,.additional-skill-card:after{
          content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
          background:linear-gradient(120deg,transparent 20%,rgba(255,255,255,.045) 45%,transparent 70%);
          transform:translateX(-120%);transition:transform .8s ease;
        }
        .hero-card:hover:after,.project:hover:before,.timeline-card:hover:after,
        .contact:hover:after,.additional-skill-card:hover:after{transform:translateX(120%)}
        .hero-card:hover{border-color:rgba(34,211,238,.38);box-shadow:0 30px 90px rgba(0,0,0,.30),0 0 40px rgba(139,92,246,.08)}
        .timeline-card:hover{border-color:rgba(139,92,246,.30);transform:translateY(-3px);box-shadow:0 18px 45px rgba(0,0,0,.16)}
        .contact:hover{border-color:rgba(34,211,238,.30);box-shadow:0 25px 70px rgba(0,0,0,.22),0 0 35px rgba(34,211,238,.06)}
        .project-icon{transition:transform .3s ease,box-shadow .3s ease}
        .project:hover .project-icon{transform:rotate(-4deg) scale(1.06);box-shadow:0 0 25px rgba(34,211,238,.14)}
        .tech{position:relative;overflow:hidden}
        .tech:before{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent,rgba(255,255,255,.07),transparent);transform:translateX(-120%);transition:transform .55s ease}
        .tech:hover:before{transform:translateX(120%)}
        .hero h1 .accent{text-shadow:0 0 35px rgba(34,211,238,.08)}
        .hero-meta span{transition:color .2s ease,transform .2s ease}
        .hero-meta span:hover{color:#e0f2fe;transform:translateY(-2px)}
        .job-availability{
          position:relative;display:inline-flex;align-items:center;gap:10px;
          width:max-content;max-width:100%;margin:18px 0 4px;padding:11px 16px;
          border:1px solid rgba(52,211,153,.34);border-radius:999px;
          background:linear-gradient(135deg,rgba(16,185,129,.13),rgba(34,211,238,.08));
          color:#d1fae5;font-size:12px;font-weight:900;letter-spacing:.025em;
          box-shadow:0 8px 28px rgba(16,185,129,.08),inset 0 1px 0 rgba(255,255,255,.06);
          overflow:hidden;animation:availabilityGlow 3s ease-in-out infinite;
        }
        .job-availability:before{
          content:"";position:absolute;inset:0;
          background:linear-gradient(110deg,transparent 20%,rgba(255,255,255,.08) 50%,transparent 80%);
          transform:translateX(-120%);animation:availabilityShine 4s ease-in-out infinite;
        }
        .job-availability span:last-child{position:relative;z-index:1}
        .job-availability-dot{
          position:relative;z-index:1;width:8px;height:8px;flex:0 0 8px;border-radius:50%;
          background:#34d399;box-shadow:0 0 0 4px rgba(52,211,153,.10),0 0 14px rgba(52,211,153,.65);
          animation:availabilityPulse 1.8s ease-in-out infinite;
        }
        @keyframes availabilityPulse{
          0%,100%{transform:scale(1);opacity:1}
          50%{transform:scale(1.22);opacity:.78}
        }
        @keyframes availabilityGlow{
          0%,100%{box-shadow:0 8px 28px rgba(16,185,129,.07),inset 0 1px 0 rgba(255,255,255,.06)}
          50%{box-shadow:0 10px 34px rgba(16,185,129,.14),0 0 20px rgba(34,211,238,.05),inset 0 1px 0 rgba(255,255,255,.08)}
        }
        @keyframes availabilityShine{
          0%,65%{transform:translateX(-120%)}
          85%,100%{transform:translateX(120%)}
        }
        .status-dot{animation:statusPulse 2.2s ease-in-out infinite}
        .internship-badge{box-shadow:0 0 0 rgba(139,92,246,0);animation:badgeGlow 3.5s ease-in-out infinite}
        .experience-card{transition:transform .3s ease,border-color .3s ease,box-shadow .3s ease}
        .experience-card:hover{transform:translateY(-4px);border-color:rgba(139,92,246,.48);box-shadow:0 24px 65px rgba(0,0,0,.24),0 0 35px rgba(124,58,237,.08)}
        @keyframes statusPulse{0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,.25)}50%{box-shadow:0 0 0 7px rgba(52,211,153,0)}}
        @keyframes badgeGlow{0%,100%{box-shadow:0 0 0 rgba(139,92,246,0)}50%{box-shadow:0 0 24px rgba(139,92,246,.09)}}
        .project:nth-child(2){animation-delay:.08s}.project:nth-child(3){animation-delay:.16s}.project:nth-child(4){animation-delay:.24s}
        .hero .status{animation:pulseGlow 2.8s ease-in-out infinite}
        @keyframes riseIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 rgba(52,211,153,0)}50%{box-shadow:0 0 24px rgba(52,211,153,.08)}}
        @media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
        @media(max-width:900px){
          .hero-grid,.about-grid,.contact,.skills-grid{grid-template-columns:1fr}
          .project-grid{grid-template-columns:1fr}
          .contact{padding:40px 28px}
        }

        /* Mobile typography: keep the desktop design unchanged, but scale text down
           and allow every line to wrap naturally on narrow screens. */
        @media(max-width:700px){
          body{font-size:13px}
          .hero h1{font-size:clamp(34px,10.5vw,52px);line-height:1.02;letter-spacing:-.045em}
          .hero-lead{font-size:14px;line-height:1.7;margin:20px 0 24px}
          .section-heading h2{font-size:clamp(27px,7.5vw,40px);line-height:1.08}
          .section-heading p{font-size:13px;line-height:1.7}
          .about-copy{font-size:14px;line-height:1.75}
          .experience-role{font-size:21px}
          .experience-list li{font-size:12px}
          .project h3{font-size:18px}
          .project p{font-size:12.5px;line-height:1.7}
          .timeline-card h3{font-size:18px}
          .timeline-card h4{font-size:12px}
          .timeline-card p{font-size:12.5px}
          .contact h2{font-size:clamp(28px,8vw,42px)}
          .contact p{font-size:13px;line-height:1.7}
          .contact-link{font-size:12px;padding:12px}
          .stat strong{font-size:21px}
          .stat span{font-size:10px}
          .skill-head span:first-child{font-size:12px}
          .skill-head span:last-child{font-size:10px}
          .tech{font-size:10px;padding:8px 10px}
          .footer-inner{width:100%;padding:0 14px}
          .footer-inner>span{
            width:100%;max-width:100%;display:flex;flex-wrap:wrap;
            justify-content:center;align-items:center;gap:4px 7px;
            text-align:center;white-space:normal;overflow-wrap:anywhere;
            word-break:normal;line-height:1.6;font-size:clamp(10px,2.8vw,12px);
          }
          .footer-inner>span i{flex:0 0 auto}
        }

        @media(max-width:700px){
          .learning-grid{grid-template-columns:1fr;gap:12px}
           .learning-card{padding:20px 18px}
           .learning-card p{font-size:13px;line-height:1.8}
           .learning-badge{line-height:1.5;white-space:normal}
           .additional-skills-grid{grid-template-columns:1fr;gap:12px}
          .additional-skill-card{padding:19px 18px}
          .additional-skill-card h3{font-size:17px;line-height:1.35}
          .additional-skill-card p{font-size:13px;line-height:1.8;margin-bottom:0}
          .resume-modal{padding:12px}
          .resume-modal-card{width:96vw;max-height:96vh;padding:10px;border-radius:16px}
          .resume-modal-title{padding:4px 48px 10px 4px}
          .resume-image-wrap{max-height:calc(96vh - 60px)}
          .resume-modal-close{top:8px;right:8px;width:36px;height:36px}
          .skills-grid{gap:28px}
          .skill-list{padding:18px}
          .tech-cloud{gap:8px}
          .tech{padding:9px 11px}
          .contact-links{gap:8px}
          .profile-frame{padding:5px}
          .hero-card{padding:22px}
          .job-availability{
            width:100%;max-width:none;justify-content:center;text-align:center;
            white-space:normal;line-height:1.45;border-radius:14px;padding:11px 13px;
          }
          .quick-item{align-items:flex-start;flex-wrap:wrap}
          .quick-item span:last-child{text-align:left;max-width:100%;line-height:1.6}
          .experience-card{padding:23px 20px}
           .experience-top{display:block}
           .experience-role{font-size:23px}
           .experience-date{display:inline-flex;margin-top:14px}
           .experience-list li{font-size:13px;line-height:1.75}
           .experience-stack{gap:6px}
          .project{min-height:auto;padding:22px}
          .project:after{top:14px;right:14px}
          .project h3{font-size:20px}
          .project p{font-size:14px;line-height:1.8}
          .project-meta{align-items:flex-start;line-height:1.6}
          .contact-link{align-items:flex-start}
          .contact-link>span:nth-child(2){overflow-wrap:anywhere}
        }
        @media(max-width:700px){
          .container{width:min(calc(100% - 28px),var(--max))}
          .nav-inner{height:66px}
          .nav-links{display:none;position:absolute;left:14px;right:14px;top:70px;flex-direction:column;align-items:stretch;gap:4px;padding:12px;border:1px solid var(--line);border-radius:15px;background:rgba(9,14,25,.97);box-shadow:0 20px 50px rgba(0,0,0,.35)}
          .nav-links.open{display:flex}
          .nav-links button{text-align:left;padding:12px}
          .mobile-menu{display:block}
          .section{padding:80px 0}
          .hero{padding:120px 0 65px}
          .hero-grid{gap:38px}
          .hero h1{font-size:clamp(44px,14vw,68px)}
          .stats{grid-template-columns:1fr 1fr}
          .stat:nth-child(2){border-right:0}
          .stat:nth-child(-n+2){border-bottom:1px solid var(--line)}
          .strengths{grid-template-columns:1fr}
          .back-top{right:16px;bottom:16px}
        }
        @media(max-width:420px){
          .footer{padding:22px 0}
          .footer-inner>span{font-size:10px;gap:4px 6px;line-height:1.55}
          .hero-actions .btn{width:100%}
          .internship-badge{line-height:1.5;white-space:normal}
          .project-insight span{font-size:12px}
          .hero-meta{display:grid;gap:10px}
          .hero-card{padding:22px}
          .stats{grid-template-columns:1fr}
          .stat{border-right:0;border-bottom:1px solid var(--line)}
          .stat:last-child{border-bottom:0}
          .project{min-height:0}
          .project-top{padding-right:0}
          .project-number{font-size:29px}
          .project-icon{width:44px;height:44px}
          .project:after{position:relative;top:auto;right:auto;display:inline-flex;width:max-content;margin-top:12px;opacity:1;transform:none}
          .quick-item{display:grid;grid-template-columns:1fr;gap:4px}
          .quick-item span:last-child{text-align:left}
        }
      `}</style>

      <header className="navbar">
        <div className="container nav-inner">
          <button className="brand" onClick={() => go("home")} aria-label="Go to home">
            <span className="brand-mark"><Icon name="code" size={19}/></span>
            Ajay <span>Kedar</span>
          </button>

          <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
            <button className={activeSection === "about" ? "active" : ""} onClick={() => go("about")}>About</button>
            <button className={activeSection === "education" ? "active" : ""} onClick={() => go("education")}>Education</button>
            <button className={activeSection === "personal" ? "active" : ""} onClick={() => go("personal")}>Profile</button>
            <button className={activeSection === "projects" ? "active" : ""} onClick={() => go("projects")}>Projects</button>
            <button className={activeSection === "skills" ? "active" : ""} onClick={() => go("skills")}>Skills</button>
            <button className={activeSection === "learning" ? "active" : ""} onClick={() => go("learning")}>Learning</button>
            <button className={`nav-cta ${activeSection === "contact" ? "active" : ""}`} onClick={() => go("contact")}>Contact</button>
          </nav>

          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <Icon name={menuOpen ? "close" : "menu"}/>
          </button>
        </div>
      </header>

      <main>
        {/* Hero / introduction */}
        <section id="home" className="hero">
          <div className="container hero-grid">
            <div>
              <div className="status"><i className="status-dot"/> {profile.availability}</div>
              <div className="internship-badge"><Icon name="briefcase" size={14}/> 6 Months MERN Stack Internship • 2024</div>
              <h1>Turning <span className="accent">Ideas Into Scalable</span>  Digital Solutions.</h1>
              <p className="hero-lead">
                I’m <strong style={{color:"white"}}>Ajay Kedar</strong>, an MCA graduate and full-stack developer focused on building practical, responsive and scalable web applications with modern JavaScript technologies.
              </p>
              <div className="hero-actions">
                <a className="btn btn-secondary" href={`mailto:${profile.email}`}>Let's Connect <Icon name="mail" size={16}/></a>
                <button className="btn btn-preview" onClick={() => setResumePreviewOpen(true)} aria-label="Preview Resume">
                  <Icon name="external" size={16}/> Preview Resume
                </button>
                <a className="btn btn-resume" href={resumeImage} download="Ajay-Kedar-Resume.jpg" aria-label="Download Ajay Kedar Resume">
                  <Icon name="download" size={16}/> Download Resume
                </a>
              </div>
              <div className="hero-meta">
                <span><Icon name="map" size={15}/> {profile.location}</span>
                <span><Icon name="code" size={15}/> React • Node • PostgreSQL</span>
                <span><Icon name="check" size={15}/> MCA Graduate</span>
              </div>
              {/* Recruiter-facing availability highlight */}
              <div className="job-availability">
                <span className="job-availability-dot" aria-hidden="true"></span>
                <span>Open to Full-Time Software Development Opportunities</span>
              </div>
            </div>

            {/* White outer frame gives the profile card a clean premium edge. */}
            <div className="profile-frame">
            <aside className="hero-card">
              <div className="avatar"><img src={profileImage} alt="Ajay Kedar" /></div>
              <h3>{profile.name}</h3>
              <div className="hero-card-role">{profile.role}</div>
              <div className="hero-card-line"/>
              <div className="quick-list">
                <div className="quick-item"><span>Frontend</span><span>React / JavaScript</span></div>
                <div className="quick-item"><span>Backend</span><span>Node / Express</span></div>
                <div className="quick-item"><span>Database</span><span>PostgreSQL / Supabase</span></div>
                <div className="quick-item"><span>Deployment</span><span>Vercel / Render</span></div>
                <div className="quick-item"><span>Focus</span><span>MERN Stack Development</span></div>
              </div>
              <div className="social-row">
                <a className="social github" href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub"><SocialIcon type="github"/></a>
                <a className="social linkedin" href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><SocialIcon type="linkedin"/></a>
                <a className="social instagram" href={profile.instagram} target="_blank" rel="noreferrer" aria-label="Instagram"><SocialIcon type="instagram"/></a>
                <a className="social" href={`mailto:${profile.email}`} aria-label="Email"><SocialIcon type="mail"/></a>
              </div>
            </aside>
            </div>
          </div>
        </section>

        <section className="container" style={{paddingBottom:20}}>
          <div className="stats">
            <div className="stat"><strong>04+</strong><span>Featured Projects</span></div>
            <div className="stat"><strong>14+</strong><span>Technologies Used</span></div>
            <div className="stat"><strong>MCA</strong><span>Post-Graduate • 2025</span></div>
            <div className="stat"><strong>100%</strong><span>Hands-on Development</span></div>
          </div>
        </section>

        {/* About section */}
        <section id="about" className="section">
          <div className="container">
            <div className="section-heading">
              <div className="eyebrow">01 — About Me</div>
              <h2>Developer mindset. Practical execution.</h2>
              <p>A focused technical profile built around real projects, clean interfaces and practical full-stack development.</p>
            </div>
            <div className="about-grid">
              <div className="about-copy">
                <p>I am an <strong style={{color:"white"}}>MCA graduate</strong> with a strong interest in software development and modern web technologies.</p>
                <p>My practical work covers frontend interfaces, backend APIs, PostgreSQL databases, authentication and access workflows, file handling and deployment-oriented architecture.</p>
                <p>I enjoy converting ideas into useful products and continuously improving projects through debugging, UX refinement and structured code.</p>
              </div>
              <div className="strengths">
                {strengths.map(item => <div className="strength" key={item}><span className="check"><Icon name="check" size={16}/></span><span>{item}</span></div>)}
              </div>
            </div>
          </div>
        </section>

        {/* Education + internship timeline */}
        <section id="education" className="section" style={{background:"rgba(15,23,42,.18)"}}>
          <div className="container">
            <div className="section-heading">
              <div className="eyebrow">02 — Education & Experience</div>
              <h2>Education & professional experience.</h2>
            </div>
            <div className="timeline">
              {education.map(item => (
                <div className="timeline-item" key={item.title}>
                  <span className="timeline-dot"/>
                  <div className="timeline-card">
                    <div className="period">{item.period}</div>
                    <h3>{item.title}</h3>
                    <h4>{item.subtitle}</h4>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
              <div className="timeline-item">
                <span className="timeline-dot" style={{background:"var(--green)"}}/>
                <div className="experience-card">
                  <div className="experience-top">
                    <div>
                      <div className="period" style={{color:"var(--green)"}}>Internship • Real-World Experience</div>
                      <h3 className="experience-role">Full-Stack Web Development</h3>
                      <div className="experience-company">Enginuspark Technology • Nashik</div>
                    </div>
                    <div className="experience-date">Jan 2024 – Jul 2024</div>
                  </div>

                  <div className="experience-location">
                    <Icon name="map" size={15}/> Nashik, Maharashtra
                  </div>

                  <ul className="experience-list">
                    <li>Developed and maintained responsive web interfaces using HTML, CSS, JavaScript, React and modern UI practices.</li>
                    <li>Built reusable React components and implemented interactive UI features to improve user experience.</li>
                    <li>Integrated frontend applications with REST APIs and worked with backend services for dynamic data handling.</li>
                    <li>Worked with Git and GitHub for version control, collaboration and project workflows.</li>
                    <li>Contributed to debugging, performance improvements and resolving frontend issues during development.</li>
                    <li>Worked on the real-world Kondaji Chiwda Nashik project and gained practical experience with MERN development, hosting, domain setup and deployment workflows.</li>
                  </ul>

                  <div className="experience-stack">
                    <span>React</span><span>JavaScript</span><span>Node.js</span>
                    <span>Express.js</span><span>REST APIs</span><span>Git & GitHub</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Personal profile and languages */}
        <section id="personal" className="section">
          <div className="container">
            <div className="section-heading">
              <div className="eyebrow">03 — Personal Profile</div>
              <h2>Professional details.</h2>
              <p>A concise profile overview for recruiters, companies and professional opportunities.</p>
            </div>
            <div className="about-grid">
              <div className="timeline-card">
                <div className="quick-list">
                  <div className="quick-item"><span>Full Name</span><span>{profile.name}</span></div>
                  <div className="quick-item"><span>Date of Birth</span><span>{profile.dob}</span></div>
                  <div className="quick-item"><span>Location</span><span>{profile.location}</span></div>
                  <div className="quick-item"><span>Primary Phone</span><span>{profile.phone}</span></div>
                  <div className="quick-item"><span>Alternate Phone</span><span>{profile.alternatePhone}</span></div>
                </div>
              </div>
              <div className="timeline-card">
                <div className="eyebrow" style={{marginBottom:12}}>Address</div>
                <p style={{color:"#cbd5e1",lineHeight:1.8,margin:0}}>{profile.address}</p>
                <div className="eyebrow" style={{marginTop:28,marginBottom:12}}>Languages</div>
                <div className="quick-list">
                  <div className="quick-item"><span>English</span><span>Writing • Basic Speaking • Listening & Understanding</span></div>
                  <div className="quick-item"><span>Marathi</span><span>Fluent</span></div>
                  <div className="quick-item"><span>Hindi</span><span>Fluent</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Learning, AI knowledge and logical problem-solving */}
        <section id="learning" className="section" style={{background:"rgba(15,23,42,.16)"}}>
          <div className="container">
            <div className="section-heading">
              <div className="eyebrow">05 — Learning & Technical Mindset</div>
              <h2>Always learning. Thinking logically. Building better.</h2>
              <p>Focused on continuous technical growth, practical AI knowledge and structured problem-solving for real-world software development.</p>
            </div>
            <div className="learning-badge">
              <Icon name="check" size={13}/> Continuous improvement • AI-aware development • Practical problem solving
            </div>
            <div className="learning-grid">
              {learningFocus.map(([title, description], index) => (
                <article className="learning-card" key={title}>
                  <div className="learning-icon">
                    <Icon name={index === 1 ? "code" : index === 2 ? "api" : index === 3 ? "check" : "react"} size={18}/>
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Featured projects */}
        <section id="projects" className="section">
          <div className="container">
            <div className="section-heading">
              <div className="eyebrow">04 — Selected Projects</div>
              <h2>Things I build.</h2>
              <p>Projects demonstrating full-stack development, communication systems, document workflows, database integration and product thinking.</p>
            </div>
            <div className="project-grid">
              {projects.map(project => (
                <article className="project" key={project.number}>
                  <div className="project-top">
                    <div className="project-number">{project.number}</div>
                    <div className="project-icon"><Icon name={project.icon} size={22}/></div>
                  </div>
                  <div className="project-category">{project.category}</div>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <div className="project-bottom">
                    {/* Each project shows a compact Problem → Solution → Technology story. */}
                    <div className="project-insight">
                      <div><strong>Problem</strong><span>{project.problem}</span></div>
                      <div><strong>Solution</strong><span>{project.solution}</span></div>
                    </div>
                    <div className="chips">{project.stack.map(t => <span className="chip" key={t}><TechIcon tech={t}/>{t}</span>)}</div>
                    <div className="project-meta"><Icon name="briefcase" size={13}/> {project.meta}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Technical toolkit */}
        <section id="skills" className="section" style={{background:"rgba(15,23,42,.18)"}}>
          <div className="container">
            <div className="section-heading">
              <div className="eyebrow">05 — Skills & Technologies</div>
              <h2>My technical toolkit.</h2>
              <p>Technologies I use to design, develop, connect and deploy web applications.</p>
            </div>
            <div className="skills-grid">
              <div className="skill-list">
                {skills.map(([name, level, value]) => (
                  <div key={name}>
                    <div className="skill-head"><span>{name}</span><span>{level}</span></div>
                    <div className="bar"><i style={{width:`${value}%`}}/></div>
                  </div>
                ))}
              </div>
              <div>
                <div className="eyebrow" style={{marginBottom:18}}>Technologies</div>
                <div className="tech-cloud">{technologies.map(t => <span className="tech" key={t}>{t}</span>)}</div>
              </div>

              <div style={{marginTop:38,gridColumn:"1 / -1"}}>
                <div className="eyebrow" style={{marginBottom:18}}>Additional Skills & Knowledge</div>
                <div className="additional-skills-grid">
                  {additionalSkills.map(([title, text]) => (
                    <div className="additional-skill-card" key={title}>
                      <h3 style={{marginTop:0,fontSize:17}}>{title}</h3>
                      <p>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact and social links */}
        <section id="contact" className="section">
          <div className="container">
            <div className="contact">
              <div>
                <div className="eyebrow">06 — Contact</div>
                <h2>Let’s build something useful.</h2>
                <p>I’m interested in software development opportunities, internships, full-stack projects and meaningful technical collaborations.</p>
                <div className="hero-actions">
                  <a className="btn btn-primary" href={`mailto:${profile.email}`}>Email Me <Icon name="arrow" size={16}/></a>
                  <a className="btn btn-secondary" href={`tel:${profile.phone}`}>Call Me <Icon name="phone" size={16}/></a>
                </div>
              </div>
              <div className="contact-links">
                <a className="contact-link" href={`mailto:${profile.email}`}><span className="email-brand"><Icon name="mail" size={18}/></span><span>{profile.email}</span></a>
                <a className="contact-link" href={`tel:${profile.phone}`}><span className="phone-brand"><Icon name="phone" size={18}/></span><span>{profile.phone}</span></a>
                <a className="contact-link" href={`tel:${profile.alternatePhone}`}><span className="phone-brand"><Icon name="phone" size={18}/></span><span>{profile.alternatePhone} • Alternate</span></a>
                <a className="contact-link" href={profile.linkedin} target="_blank" rel="noreferrer"><span className="linkedin"><Icon name="linkedin" size={18}/></span><span>LinkedIn</span><span className="brand-icon" style={{color:"#0a66c2"}}><Icon name="external" size={14}/></span></a>
                <a className="contact-link" href={profile.github} target="_blank" rel="noreferrer"><span className="github"><Icon name="github" size={18}/></span><span>GitHub</span><span className="brand-icon"><Icon name="external" size={14}/></span></a>
                <a className="contact-link" href={profile.instagram} target="_blank" rel="noreferrer"><span className="instagram"><Icon name="instagram" size={18}/></span><span>Instagram</span><span className="brand-icon" style={{color:"#e1306c"}}><Icon name="external" size={14}/></span></a>
                <div className="contact-link"><Icon name="map" size={18}/><span>{profile.location}</span></div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Resume preview modal — opens the resume image in the center of the screen. */}
      {resumePreviewOpen && (
        <div
          className="resume-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Resume Preview"
          onClick={() => setResumePreviewOpen(false)}
        >
          <div className="resume-modal-card" onClick={(event) => event.stopPropagation()}>
            <button
              className="resume-modal-close"
              onClick={() => setResumePreviewOpen(false)}
              aria-label="Close Resume Preview"
            >
              <Icon name="close" size={20}/>
            </button>
            <div className="resume-modal-title">Resume Preview</div>
            <div className="resume-image-wrap">
              <img src={resumeImage} alt="Ajay Kedar Resume" className="resume-preview-image"/>
            </div>
          </div>
        </div>
      )}

      {/* Footer — one clean professional line; contact/social links stay in the Contact section above. */}
      <footer className="footer">
        <div className="container footer-inner">
          <span>
            © {new Date().getFullYear()} <strong>Ajay Kedar</strong>. All rights reserved.
            <i aria-hidden="true">•</i>
            Designed &amp; developed with <b>React</b>.
          </span>
        </div>
      </footer>

      {showBackTop && (
        <button className="back-top" onClick={backToTop} aria-label="Back to top">
          <span>↑</span>
        </button>
      )}
    </div>
  );
}
