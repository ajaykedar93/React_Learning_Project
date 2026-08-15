import React, { useState } from "react";

/**
 * Portfolio.jsx
 * Professional personal portfolio for Ajay Kedar
 * React + JSX, responsive, no external CSS required.
 *
 * Replace only the values marked "ADD YOUR..." if you want to add
 * exact college, dates, email, phone, GitHub, LinkedIn or internship details.
 */

const profile = {
  name: "Ajay Kedar",
  role: "MCA Student • Full-Stack Developer",
  location: "India",
  availability: "Open to Internship & Entry-Level Opportunities",
  email: "ADD YOUR EMAIL",
  phone: "ADD YOUR PHONE",
  github: "ADD YOUR GITHUB URL",
  linkedin: "ADD YOUR LINKEDIN URL",
  resume: "#",
};

const skills = [
  { name: "React.js", level: "Advanced", value: 88 },
  { name: "JavaScript", level: "Advanced", value: 86 },
  { name: "Node.js & Express", level: "Advanced", value: 84 },
  { name: "PostgreSQL", level: "Strong", value: 82 },
  { name: "REST APIs", level: "Strong", value: 84 },
  { name: "HTML & CSS", level: "Advanced", value: 90 },
  { name: "Git & GitHub", level: "Strong", value: 82 },
  { name: "Supabase", level: "Working Knowledge", value: 76 },
];

const technologies = [
  "React",
  "JavaScript",
  "JSX",
  "Node.js",
  "Express.js",
  "PostgreSQL",
  "Supabase",
  "REST API",
  "Git",
  "GitHub",
  "Vercel",
  "Render",
];

const projects = [
  {
    number: "01",
    title: "Personal Productivity Platform",
    category: "Full-Stack Web Application",
    description:
      "A personal platform designed to manage notes, trading journal entries, documents, important links and files with a structured dashboard experience.",
    stack: ["React", "Node.js", "Express", "PostgreSQL", "Supabase"],
    status: "Built & Continuously Improved",
  },
  {
    number: "02",
    title: "Telegram-Style Channel Platform",
    category: "Real-Time Communication",
    description:
      "A channel-based communication system with public/private channels, member management, private PIN access, trusted-device logic, notes, files and media handling.",
    stack: ["React", "Node.js", "Express", "PostgreSQL", "REST APIs"],
    status: "Development Project",
  },
  {
    number: "03",
    title: "Trading Journal & Analysis",
    category: "Finance / Productivity",
    description:
      "A structured trading journal concept for recording trades, risk-reward information, market observations and strategy-based analysis.",
    stack: ["React", "JavaScript", "PostgreSQL"],
    status: "Personal Project",
  },
];

const education = [
  {
    period: "Current",
    title: "Master of Computer Applications (MCA)",
    subtitle: "Postgraduate Computer Applications",
    description:
      "Currently pursuing MCA with a focus on software development, web technologies, databases and practical application development.",
  },
  {
    period: "Previous",
    title: "Computer Applications / Graduation",
    subtitle: "ADD YOUR EXACT DEGREE & COLLEGE",
    description:
      "Add your exact undergraduate qualification, institution and completion year here.",
  },
];

const experience = [
  {
    type: "Internship / Experience",
    title: "Software Development",
    company: "ADD COMPANY / INTERNSHIP NAME",
    period: "ADD DATES",
    description:
      "Add your verified internship or professional experience here. Mention the application, technologies, responsibilities and measurable results.",
  },
];

const languages = [
  { name: "English", level: "Professional" },
  { name: "Marathi", level: "Native / Fluent" },
  { name: "Hindi", level: "Fluent" },
];

const strengths = [
  "Full-stack application development",
  "REST API design and integration",
  "Database-driven application architecture",
  "Responsive UI development",
  "Problem solving and debugging",
  "Independent project development",
];

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    code: <><path d="m8 9-4 3 4 3" /><path d="m16 9 4 3-4 3" /><path d="m14 5-4 14" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <><path d="M7 3h3l2 5-2 2a14 14 0 0 0 4 4l2-2 5 2v3c0 1-1 2-2 2C10 19 5 14 5 5c0-1 1-2 2-2Z" /></>,
    github: <><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.5-.4 7-1.7 7-7A5.4 5.4 0 0 0 20 4a5 5 0 0 0-.1-3.5S18.7.1 15 2.5a13.5 13.5 0 0 0-6 0C5.3.1 4.1.5 4.1.5A5 5 0 0 0 4 4a5.4 5.4 0 0 0-1 3.5c0 5.3 3.5 6.6 7 7A4.8 4.8 0 0 0 9 18v4" /><path d="M9 18c-4.5 2-4.5-2-6.5-2" /></>,
    linkedin: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6Z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></>,
    menu: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    external: <><path d="M14 4h6v6" /><path d="m20 4-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    map: <><circle cx="12" cy="10" r="3" /><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /></>,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="section-heading">
      <div className="eyebrow">{eyebrow}</div>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

export default function Portfolio() {
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="portfolio-app">
      <style>{`
        :root {
          --bg: #070b14;
          --bg-soft: #0b1220;
          --panel: rgba(15, 23, 42, .72);
          --panel-strong: #101827;
          --line: rgba(148, 163, 184, .15);
          --text: #f8fafc;
          --muted: #94a3b8;
          --blue: #60a5fa;
          --cyan: #22d3ee;
          --green: #34d399;
          --purple: #a78bfa;
          --max: 1180px;
        }

        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body {
          margin: 0;
          background: var(--bg);
          color: var(--text);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        a { color: inherit; text-decoration: none; }
        button { font: inherit; }
        .portfolio-app { min-height: 100vh; overflow-x: hidden; background:
          radial-gradient(circle at 85% 5%, rgba(96,165,250,.13), transparent 28rem),
          radial-gradient(circle at 5% 28%, rgba(34,211,238,.07), transparent 25rem),
          var(--bg);
        }
        .container { width: min(calc(100% - 40px), var(--max)); margin: 0 auto; }
        .section { padding: 105px 0; scroll-margin-top: 80px; }
        .section-heading { max-width: 700px; margin-bottom: 48px; }
        .eyebrow {
          color: var(--blue);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .18em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .section-heading h2 {
          margin: 0;
          font-size: clamp(32px, 5vw, 52px);
          line-height: 1.05;
          letter-spacing: -.045em;
        }
        .section-heading p {
          margin: 18px 0 0;
          color: var(--muted);
          font-size: 16px;
          line-height: 1.8;
        }

        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          border-bottom: 1px solid rgba(148,163,184,.09);
          background: rgba(7,11,20,.78);
          backdrop-filter: blur(20px);
        }
        .nav-inner {
          height: 74px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .brand { display: flex; align-items: center; gap: 11px; font-weight: 900; letter-spacing: -.03em; }
        .brand-mark {
          width: 38px; height: 38px; border-radius: 11px;
          display: grid; place-items: center;
          background: linear-gradient(135deg, var(--blue), var(--cyan));
          color: #06101e;
          box-shadow: 0 10px 30px rgba(34,211,238,.16);
        }
        .brand span { color: var(--muted); font-weight: 600; }
        .nav-links { display: flex; align-items: center; gap: 28px; }
        .nav-links button {
          border: 0; background: transparent; color: #cbd5e1; cursor: pointer;
          font-size: 13px; font-weight: 700;
        }
        .nav-links button:hover { color: white; }
        .nav-cta {
          padding: 10px 16px !important; border-radius: 10px !important;
          background: #f8fafc !important; color: #07101c !important;
        }
        .mobile-menu { display: none; border: 0; background: transparent; color: white; cursor: pointer; }

        .hero { min-height: 100vh; padding: 160px 0 90px; display: flex; align-items: center; }
        .hero-grid { display: grid; grid-template-columns: 1.25fr .75fr; gap: 80px; align-items: center; }
        .status {
          display: inline-flex; align-items: center; gap: 9px;
          padding: 8px 12px; border: 1px solid rgba(52,211,153,.22);
          background: rgba(52,211,153,.06); color: #a7f3d0; border-radius: 999px;
          font-size: 12px; font-weight: 800; margin-bottom: 24px;
        }
        .status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 14px var(--green); }
        .hero h1 {
          margin: 0; max-width: 850px; font-size: clamp(48px, 7vw, 88px);
          line-height: .98; letter-spacing: -.065em;
        }
        .hero h1 .accent {
          background: linear-gradient(110deg, #fff, var(--blue) 45%, var(--cyan));
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .hero-lead { max-width: 690px; color: #a9b6c9; font-size: 18px; line-height: 1.8; margin: 26px 0 30px; }
        .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; }
        .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 9px;
          min-height: 46px; padding: 0 17px; border-radius: 11px; border: 1px solid var(--line);
          cursor: pointer; font-weight: 800; font-size: 13px;
          transition: .2s ease;
        }
        .btn-primary { background: #f8fafc; color: #07101c; border-color: #f8fafc; }
        .btn-secondary { background: rgba(15,23,42,.7); color: #e2e8f0; }
        .btn:hover { transform: translateY(-2px); }
        .hero-meta { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 30px; color: var(--muted); font-size: 13px; }
        .hero-meta span { display: inline-flex; align-items: center; gap: 7px; }

        .hero-card {
          position: relative; min-height: 450px; padding: 28px; border: 1px solid var(--line);
          border-radius: 26px; background: linear-gradient(145deg, rgba(17,28,47,.9), rgba(8,13,24,.72));
          box-shadow: 0 30px 80px rgba(0,0,0,.24); overflow: hidden;
        }
        .hero-card::before {
          content: ""; position: absolute; width: 230px; height: 230px; border-radius: 50%;
          background: rgba(96,165,250,.14); filter: blur(10px); top: -100px; right: -80px;
        }
        .avatar {
          width: 112px; height: 112px; border-radius: 28px; display: grid; place-items: center;
          background: linear-gradient(135deg, #172554, #0e7490); border: 1px solid rgba(125,211,252,.22);
          font-size: 42px; font-weight: 950; letter-spacing: -.06em; color: white;
          position: relative; z-index: 1;
        }
        .hero-card h3 { margin: 28px 0 7px; font-size: 27px; letter-spacing: -.035em; }
        .hero-card-role { color: var(--blue); font-weight: 800; font-size: 14px; }
        .hero-card-line { height: 1px; background: var(--line); margin: 24px 0; }
        .quick-list { display: grid; gap: 14px; }
        .quick-item { display: flex; justify-content: space-between; gap: 15px; font-size: 13px; }
        .quick-item span:first-child { color: var(--muted); }
        .quick-item span:last-child { color: #e2e8f0; text-align: right; }

        .stats {
          display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--line);
          border-radius: 18px; overflow: hidden; background: rgba(15,23,42,.5);
        }
        .stat { padding: 24px; border-right: 1px solid var(--line); }
        .stat:last-child { border-right: 0; }
        .stat strong { display: block; font-size: 25px; letter-spacing: -.04em; }
        .stat span { color: var(--muted); font-size: 12px; margin-top: 5px; display: block; }

        .about-grid { display: grid; grid-template-columns: .8fr 1.2fr; gap: 70px; }
        .about-copy { color: #a9b6c9; line-height: 1.85; font-size: 16px; }
        .about-copy p { margin: 0 0 18px; }
        .strengths { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 25px; }
        .strength {
          display: flex; align-items: flex-start; gap: 10px; padding: 15px;
          border: 1px solid var(--line); border-radius: 12px; background: rgba(15,23,42,.42);
          color: #cbd5e1; font-size: 13px; line-height: 1.5;
        }
        .check { color: var(--green); flex: 0 0 auto; margin-top: 1px; }

        .timeline { position: relative; display: grid; gap: 20px; }
        .timeline::before { content: ""; position: absolute; left: 10px; top: 12px; bottom: 12px; width: 1px; background: var(--line); }
        .timeline-item { position: relative; padding-left: 40px; }
        .timeline-dot { position: absolute; left: 4px; top: 8px; width: 13px; height: 13px; border-radius: 50%; background: var(--blue); box-shadow: 0 0 0 5px rgba(96,165,250,.1); }
        .timeline-card { padding: 25px; border: 1px solid var(--line); border-radius: 16px; background: rgba(15,23,42,.48); }
        .period { color: var(--blue); font-size: 11px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
        .timeline-card h3 { margin: 9px 0 5px; font-size: 20px; }
        .timeline-card h4 { margin: 0 0 12px; color: #cbd5e1; font-size: 13px; font-weight: 700; }
        .timeline-card p { margin: 0; color: var(--muted); line-height: 1.7; font-size: 14px; }

        .project-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .project {
          position: relative; padding: 28px; min-height: 390px; border: 1px solid var(--line);
          border-radius: 19px; background: linear-gradient(150deg, rgba(17,28,47,.75), rgba(10,15,26,.65));
          display: flex; flex-direction: column; transition: .25s ease;
        }
        .project:hover { transform: translateY(-5px); border-color: rgba(96,165,250,.3); }
        .project-number { color: #475569; font-size: 34px; font-weight: 950; letter-spacing: -.06em; }
        .project-category { color: var(--blue); font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .1em; margin-top: 25px; }
        .project h3 { margin: 9px 0 12px; font-size: 23px; letter-spacing: -.035em; }
        .project p { color: var(--muted); font-size: 14px; line-height: 1.75; margin: 0; }
        .project-bottom { margin-top: auto; }
        .chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 22px; }
        .chip { padding: 6px 9px; border-radius: 7px; background: rgba(96,165,250,.08); color: #bfdbfe; font-size: 11px; font-weight: 800; }
        .project-status { margin-top: 18px; color: #64748b; font-size: 11px; font-weight: 800; }

        .skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
        .skill-list { display: grid; gap: 20px; }
        .skill-head { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 9px; }
        .skill-head span:first-child { font-size: 13px; font-weight: 800; }
        .skill-head span:last-child { color: var(--muted); font-size: 11px; }
        .bar { height: 6px; border-radius: 999px; background: #172033; overflow: hidden; }
        .bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--blue), var(--cyan)); }
        .tech-cloud { display: flex; flex-wrap: wrap; gap: 10px; align-content: flex-start; }
        .tech {
          padding: 10px 13px; border: 1px solid var(--line); border-radius: 10px;
          color: #cbd5e1; background: rgba(15,23,42,.5); font-size: 12px; font-weight: 800;
        }

        .language-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .language { padding: 23px; border: 1px solid var(--line); border-radius: 15px; background: rgba(15,23,42,.45); }
        .language strong { font-size: 16px; }
        .language span { display: block; margin-top: 7px; color: var(--muted); font-size: 12px; }

        .contact {
          padding: 75px; border: 1px solid rgba(96,165,250,.18); border-radius: 25px;
          background: radial-gradient(circle at 100% 0%, rgba(96,165,250,.13), transparent 32rem), rgba(15,23,42,.6);
          display: grid; grid-template-columns: 1.2fr .8fr; gap: 60px; align-items: center;
        }
        .contact h2 { margin: 0; font-size: clamp(32px, 5vw, 54px); letter-spacing: -.05em; }
        .contact p { color: var(--muted); line-height: 1.8; max-width: 650px; }
        .contact-links { display: grid; gap: 10px; }
        .contact-link {
          display: flex; align-items: center; gap: 12px; padding: 14px;
          border: 1px solid var(--line); border-radius: 11px; background: rgba(7,11,20,.35);
          color: #cbd5e1; font-size: 13px; font-weight: 700;
        }
        .contact-link:hover { border-color: rgba(96,165,250,.3); color: white; }
        .footer { padding: 35px 0; border-top: 1px solid var(--line); color: #64748b; font-size: 12px; }
        .footer-inner { display: flex; justify-content: space-between; gap: 20px; }
        .footer strong { color: #cbd5e1; }

        @media (max-width: 900px) {
          .hero-grid, .about-grid, .contact { grid-template-columns: 1fr; }
          .project-grid { grid-template-columns: 1fr 1fr; }
          .hero-card { min-height: auto; }
          .contact { padding: 40px 28px; }
        }
        @media (max-width: 700px) {
          .container { width: min(calc(100% - 28px), var(--max)); }
          .nav-inner { height: 66px; }
          .nav-links {
            display: none; position: absolute; left: 14px; right: 14px; top: 70px;
            flex-direction: column; align-items: stretch; gap: 5px; padding: 12px;
            border: 1px solid var(--line); border-radius: 15px; background: rgba(9,14,25,.97);
            box-shadow: 0 20px 50px rgba(0,0,0,.35);
          }
          .nav-links.open { display: flex; }
          .nav-links button { text-align: left; padding: 12px; }
          .mobile-menu { display: block; }
          .section { padding: 80px 0; }
          .hero { padding: 125px 0 70px; }
          .hero-grid { gap: 40px; }
          .hero h1 { font-size: clamp(44px, 14vw, 68px); }
          .stats { grid-template-columns: 1fr 1fr; }
          .stat:nth-child(2) { border-right: 0; }
          .stat:nth-child(-n+2) { border-bottom: 1px solid var(--line); }
          .about-grid, .skills-grid { gap: 35px; }
          .strengths, .project-grid { grid-template-columns: 1fr; }
          .language-grid { grid-template-columns: 1fr; }
          .footer-inner { flex-direction: column; }
        }
        @media (max-width: 420px) {
          .hero-actions .btn { width: 100%; }
          .hero-meta { display: grid; gap: 11px; }
          .hero-card { padding: 22px; }
          .stats { grid-template-columns: 1fr; }
          .stat { border-right: 0; border-bottom: 1px solid var(--line); }
          .stat:last-child { border-bottom: 0; }
        }
      `}</style>

      <header className="navbar">
        <div className="container nav-inner">
          <button className="brand" onClick={() => go("home")} style={{ border: 0, background: "transparent", color: "white", cursor: "pointer" }}>
            <span className="brand-mark"><Icon name="code" size={19} /></span>
            Ajay <span>Kedar</span>
          </button>

          <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
            <button onClick={() => go("about")}>About</button>
            <button onClick={() => go("education")}>Education</button>
            <button onClick={() => go("projects")}>Projects</button>
            <button onClick={() => go("skills")}>Skills</button>
            <button className="nav-cta" onClick={() => go("contact")}>Contact</button>
          </nav>

          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="container hero-grid">
            <div>
              <div className="status"><i className="status-dot" /> {profile.availability}</div>
              <h1>
                Building <span className="accent">modern web experiences</span> with code.
              </h1>
              <p className="hero-lead">
                I’m <strong style={{ color: "white" }}>Ajay Kedar</strong>, an MCA student and
                full-stack developer focused on building practical, scalable and responsive
                web applications using modern JavaScript technologies.
              </p>

              <div className="hero-actions">
                <button className="btn btn-primary" onClick={() => go("projects")}>
                  View Projects <Icon name="arrow" size={16} />
                </button>
                <button className="btn btn-secondary" onClick={() => go("contact")}>
                  Let's Connect <Icon name="mail" size={16} />
                </button>
                {profile.resume !== "#" && (
                  <a className="btn btn-secondary" href={profile.resume} target="_blank" rel="noreferrer">
                    Resume <Icon name="download" size={16} />
                  </a>
                )}
              </div>

              <div className="hero-meta">
                <span><Icon name="map" size={15} /> {profile.location}</span>
                <span><Icon name="code" size={15} /> React • Node • PostgreSQL</span>
                <span><Icon name="check" size={15} /> MCA Student</span>
              </div>
            </div>

            <aside className="hero-card">
              <div className="avatar">AK</div>
              <h3>{profile.name}</h3>
              <div className="hero-card-role">{profile.role}</div>
              <div className="hero-card-line" />
              <div className="quick-list">
                <div className="quick-item"><span>Focus</span><span>Full-Stack Development</span></div>
                <div className="quick-item"><span>Frontend</span><span>React / JavaScript</span></div>
                <div className="quick-item"><span>Backend</span><span>Node / Express</span></div>
                <div className="quick-item"><span>Database</span><span>PostgreSQL / Supabase</span></div>
                <div className="quick-item"><span>Career Goal</span><span>Software Development</span></div>
              </div>
            </aside>
          </div>
        </section>

        <section className="container" style={{ paddingBottom: 20 }}>
          <div className="stats">
            <div className="stat"><strong>03+</strong><span>Major Personal Projects</span></div>
            <div className="stat"><strong>12+</strong><span>Technologies Used</span></div>
            <div className="stat"><strong>MCA</strong><span>Currently Pursuing</span></div>
            <div className="stat"><strong>100%</strong><span>Hands-on Development</span></div>
          </div>
        </section>

        <section id="about" className="section">
          <div className="container">
            <SectionHeading
              eyebrow="01 — About Me"
              title="Developer mindset. Practical execution."
              text="A focused introduction to my technical profile and the way I approach software development."
            />
            <div className="about-grid">
              <div className="about-copy">
                <p>
                  I am an <strong style={{ color: "white" }}>MCA student</strong> with a strong
                  interest in software development and modern web technologies. I enjoy turning
                  ideas into functional, clean and responsive applications.
                </p>
                <p>
                  My practical work covers frontend interfaces, backend APIs, PostgreSQL
                  databases, authentication/access flows, file handling and deployment-oriented
                  application architecture.
                </p>
                <p>
                  I continuously improve my projects by debugging real problems, refining UX,
                  improving API reliability and keeping the codebase structured.
                </p>
              </div>
              <div className="strengths">
                {strengths.map((item) => (
                  <div className="strength" key={item}>
                    <span className="check"><Icon name="check" size={16} /></span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="education" className="section" style={{ background: "rgba(15,23,42,.18)" }}>
          <div className="container">
            <SectionHeading eyebrow="02 — Education & Experience" title="Academic foundation & practical work." />
            <div className="timeline">
              {education.map((item) => (
                <div className="timeline-item" key={item.title}>
                  <span className="timeline-dot" />
                  <div className="timeline-card">
                    <div className="period">{item.period}</div>
                    <h3>{item.title}</h3>
                    <h4>{item.subtitle}</h4>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
              {experience.map((item) => (
                <div className="timeline-item" key={item.title}>
                  <span className="timeline-dot" style={{ background: "var(--green)" }} />
                  <div className="timeline-card">
                    <div className="period" style={{ color: "var(--green)" }}>{item.type} • {item.period}</div>
                    <h3>{item.title}</h3>
                    <h4>{item.company}</h4>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="projects" className="section">
          <div className="container">
            <SectionHeading
              eyebrow="03 — Selected Projects"
              title="Things I build."
              text="A selection of practical projects demonstrating full-stack development, database integration and product-focused thinking."
            />
            <div className="project-grid">
              {projects.map((project) => (
                <article className="project" key={project.number}>
                  <div className="project-number">{project.number}</div>
                  <div className="project-category">{project.category}</div>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <div className="project-bottom">
                    <div className="chips">
                      {project.stack.map((tech) => <span className="chip" key={tech}>{tech}</span>)}
                    </div>
                    <div className="project-status">{project.status}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="skills" className="section" style={{ background: "rgba(15,23,42,.18)" }}>
          <div className="container">
            <SectionHeading
              eyebrow="04 — Skills & Technologies"
              title="My technical toolkit."
              text="Technologies I use to design, develop, connect and deploy web applications."
            />
            <div className="skills-grid">
              <div className="skill-list">
                {skills.map((skill) => (
                  <div key={skill.name}>
                    <div className="skill-head">
                      <span>{skill.name}</span>
                      <span>{skill.level}</span>
                    </div>
                    <div className="bar"><i style={{ width: `${skill.value}%` }} /></div>
                  </div>
                ))}
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 18 }}>Technologies</div>
                <div className="tech-cloud">
                  {technologies.map((tech) => <span className="tech" key={tech}>{tech}</span>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <SectionHeading eyebrow="05 — Languages" title="Communication." />
            <div className="language-grid">
              {languages.map((language) => (
                <div className="language" key={language.name}>
                  <strong>{language.name}</strong>
                  <span>{language.level}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="section">
          <div className="container">
            <div className="contact">
              <div>
                <div className="eyebrow">06 — Contact</div>
                <h2>Let’s build something useful.</h2>
                <p>
                  I’m interested in software development opportunities, internships,
                  full-stack projects and meaningful technical collaborations.
                </p>
                <div className="hero-actions">
                  <a className="btn btn-primary" href={`mailto:${profile.email}`}>
                    Contact Me <Icon name="arrow" size={16} />
                  </a>
                </div>
              </div>
              <div className="contact-links">
                <a className="contact-link" href={`mailto:${profile.email}`}>
                  <Icon name="mail" size={18} /> {profile.email}
                </a>
                <a className="contact-link" href={profile.linkedin} target="_blank" rel="noreferrer">
                  <Icon name="linkedin" size={18} /> LinkedIn
                  <span style={{ marginLeft: "auto" }}><Icon name="external" size={14} /></span>
                </a>
                <a className="contact-link" href={profile.github} target="_blank" rel="noreferrer">
                  <Icon name="github" size={18} /> GitHub
                  <span style={{ marginLeft: "auto" }}><Icon name="external" size={14} /></span>
                </a>
                <div className="contact-link">
                  <Icon name="map" size={18} /> {profile.location}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <span>© {new Date().getFullYear()} <strong>Ajay Kedar</strong>. All rights reserved.</span>
          <span>Designed & developed with React.</span>
        </div>
      </footer>
    </div>
  );
}