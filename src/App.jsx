import React, { useEffect, useState, useRef } from 'react';
import { Github, Linkedin, ExternalLink, Moon, Sun, Menu, X, Mail, Mountain, Snowflake, Gamepad2, Keyboard, Dumbbell, Code, Terminal, Cpu, CircuitBoard, Cat, Dog, Car } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Data Constants
const expData = [
    {
        company: "Databricks",
        role: "Software Engineer IV",
        team: "Data Ingestion · Bellevue, WA",
        dates: "Sep 2025 – Present",
        desc: "Building scalable backend systems and data processing pipelines for large-scale ingestion.",
        tags: ["Distributed Systems", "Data Engineering", "Scala", "Cloud"]
    },
    {
        company: "Amazon Web Services",
        role: "Software Development Engineer II",
        team: "DynamoDB Core Replication · Seattle, WA",
        dates: "Apr 2023 – Sep 2025",
        desc: "Technical lead for multi-year replication protocol migration from multi-Paxos. Scaled rollout to 80M+ partitions across multi-petabyte tables. Operations lead for sustainable ticket load and root cause triage.",
        tags: ["Distributed Systems", "Java", "Paxos", "Consensus Protocols", "Operations"]
    },
    {
        company: "Amazon Web Services",
        role: "Software Development Engineer I",
        team: "DynamoDB Log Service · Seattle, WA",
        dates: "Jan 2022 – Apr 2023",
        desc: "Led development of validation and rollout mechanisms for large-scale table migrations. Drove high operational bar to reduce churn.",
        tags: ["Java", "AWS", "Distributed Systems"]
    },
    {
        company: "Amazon",
        role: "Software Development Engineer I",
        team: "Alexa Infrastructure · Bellevue, WA",
        dates: "Jul 2021 – Jan 2022",
        desc: "Owned test data intake and visualization service (Spring Boot) and data lake service for multi-source parsing (Lambda, Glue, Batch, S3).",
        tags: ["Spring Boot", "AWS Lambda", "S3", "Java"]
    },
    {
        company: "Amazon",
        role: "SDE Intern",
        team: "Amazon Alexa · Bellevue, WA",
        dates: "Jun 2020 – Aug 2020",
        desc: "Built sorting, filtering, and aggregation features on internal dev platform. Reduced service latency to 25% of original via secondary service optimization. 20+ code reviews.",
        tags: ["Java", "JavaScript", "React", "REST APIs"]
    },
    {
        company: "MathWorks",
        role: "EDG Intern — Software Engineering & QE",
        team: "Natick, MA",
        dates: "May 2019 – Aug 2019",
        desc: "Developed a new USB-over-network framework for hardware testing, reducing test authoring from days to hours. Caught 30+ bugs before a kit release.",
        tags: ["Python", "OOP", "Hardware Testing", "QE"]
    },
    {
        company: "Cornell University",
        role: "Teaching Assistant — ECE5725",
        team: "Embedded Operating Systems · Ithaca, NY",
        dates: "Aug 2020 – May 2021",
        desc: "Supported lab sections on embedded Linux (Raspberry Pi 4): GPIO, interrupt handlers, RTOS, concurrency, and filesystem operations.",
        tags: ["Embedded Linux", "Raspberry Pi", "C", "RTOS"]
    },
];

const projData = [
    {
        title: "Snake Game on ARM Microprocessor",
        tags: ["K64F ARM", "C/C++", "Assembly", "Embedded"],
        desc: "Recreated Snake from scratch on a K64F ARM microcontroller with a 64×64 LED matrix, tick-based game loop via hardware interrupts, and accelerometer tilt controls.",
        link: null,
    },
    {
        title: "Cornell FSAE — LV Fusebox & ECU",
        tags: ["Altium", "PCB Design", "CAN Bus", "EE"],
        desc: "Designed the low-voltage fusebox PCB for Cornell's Formula SAE electric racing vehicle. Co-developed the ECU handling telemetry, safety loops, and motor controller CAN comms.",
        link: "https://cornellracing.org/",
    },
    {
        title: "Neural Network RC Car",
        tags: ["Python", "OpenCV", "PyBrain", "Raspberry Pi"],
        desc: "End-to-end autonomous driving model using a neural network and OpenCV for lane detection, deployed on an embedded Raspberry Pi controlling a physical RC car.",
        link: null,
    },
    {
        title: "Juul.io — BigRed\\Hacks 2019",
        tags: ["Arduino", "IoT", "Best Hardware Award"],
        desc: "Best Hardware Implementation winner at BigRed\\Hacks 2019. An IoT Arduino-based hardware hack designed and judged in under 24 hours.",
        link: null,
    },
];

const pubData = [
    {
        title: "A radiomics platform for computing imaging features from µCT images of Thoroughbred racehorse proximal sesamoid bones: Benchmark performance and evaluation",
        venue: "Equine Veterinary Journal (BEVA)",
        year: "Jul 2020",
        url: "https://beva.onlinelibrary.wiley.com/doi/abs/10.1111/evj.13321",
        lab: "Reesink Laboratory, Cornell College of Veterinary Medicine"
    },
    {
        title: "From Anxious to Reckless: A Control Systems Approach Unifies Prefrontal-Limbic Regulation Across the Spectrum of Threat Detection",
        venue: "Frontiers in Systems Neuroscience",
        year: "Apr 2017",
        url: "https://www.frontiersin.org/articles/10.3389/fnsys.2017.00018/full",
        lab: "Lab of Computational Neurodiagnostics, Stony Brook University"
    },
];

export default function App() {
    const [darkMode, setDarkMode] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mainRef = useRef(null);
    const tileWrapperRef = useRef(null);

    useEffect(() => {
        const hour = new Date().getHours();
        // logical check: is it after 6PM or before 6AM?
        const isDarkHours = hour >= 18 || hour < 6;

        // 1. Prioritize user's manual override (localStorage)
        // 2. Fallback to time-based logic if no override exists
        if (isDarkHours) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        if (darkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
            setDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
            setDarkMode(true);
        }
    };

    // Mouse glow effect on tiled background
    useEffect(() => {
        const handleMouseMove = (e) => {
            const grid = document.querySelector('.parallax-tile-grid');
            if (!grid) return;
            const rect = grid.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            grid.style.maskImage = `radial-gradient(500px circle at ${x}px ${y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.04) 100%)`;
            grid.style.webkitMaskImage = `radial-gradient(500px circle at ${x}px ${y}px, rgba(0,0,0,1) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.04) 100%)`;
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Standard reveals
            const elements = gsap.utils.toArray('.gsap-reveal');
            elements.forEach((elem) => {
                gsap.from(elem, {
                    scrollTrigger: {
                        trigger: elem,
                        start: 'top 85%',
                    },
                    y: 12,
                    opacity: 0,
                    duration: 0.2,
                    ease: 'power2.out',
                });
            });

            // Parallax tiled background
            const tileGrid = document.querySelector('.parallax-tile-grid');
            if (tileGrid) {
                gsap.to(tileGrid, {
                    scrollTrigger: {
                        trigger: document.body,
                        start: 'top top',
                        end: 'bottom bottom',
                        scrub: true,
                    },
                    y: -1500,
                    x: 400,
                    ease: 'none',
                });
            }

        }, mainRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={mainRef} className="font-sans text-primary w-full bg-background min-h-screen relative">

            {/* Tiled icon background is rendered inside <main> below the marquee */}

            {/* A. NAVBAR */}
            <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-sm border-b-2 border-primary transition-colors duration-150">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="font-display text-2xl uppercase tracking-widest"><span className="text-accent">J</span>G.</div>

                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#experience" className="font-mono text-xs font-bold uppercase hover:text-accent transition-colors duration-150">Experience</a>
                        <a href="#projects" className="font-mono text-xs font-bold uppercase hover:text-accent transition-colors duration-150">Projects</a>
                        <a href="#publications" className="font-mono text-xs font-bold uppercase hover:text-accent transition-colors duration-150">Publications</a>
                        <a href="#about" className="font-mono text-xs font-bold uppercase hover:text-accent transition-colors duration-150">About</a>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button onClick={toggleDarkMode} className="text-primary hover:text-accent transition-colors duration-150 p-2 border-2 border-transparent hover:border-primary shadow-none hover:shadow-brutal" aria-label="Toggle Dark Mode">
                            {darkMode ? <Sun size={18} strokeWidth={3} /> : <Moon size={18} strokeWidth={3} />}
                        </button>
                        <a href="mailto:jonathan-gao@hotmail.com" className="hidden md:flex border-2 border-primary bg-accent text-primary px-4 py-1.5 font-mono text-xs font-bold uppercase shadow-brutal hover:bg-accent-secondary hover:-translate-y-0.5 transition-transform duration-150">
                            Get in Touch
                        </a>
                        <button className="md:hidden text-primary p-2 border-2 border-primary shadow-brutal" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X size={20} strokeWidth={3} /> : <Menu size={20} strokeWidth={3} />}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden border-t-2 border-primary bg-background px-6 py-4 flex flex-col space-y-4">
                        <a href="#experience" onClick={() => setMobileMenuOpen(false)} className="font-mono text-sm font-bold uppercase hover:text-accent">Experience</a>
                        <a href="#projects" onClick={() => setMobileMenuOpen(false)} className="font-mono text-sm font-bold uppercase hover:text-accent">Projects</a>
                        <a href="#publications" onClick={() => setMobileMenuOpen(false)} className="font-mono text-sm font-bold uppercase hover:text-accent">Publications</a>
                        <a href="#about" onClick={() => setMobileMenuOpen(false)} className="font-mono text-sm font-bold uppercase hover:text-accent">About</a>
                        <a href="mailto:jg992@cornell.edu" onClick={() => setMobileMenuOpen(false)} className="font-mono text-sm font-bold uppercase text-accent-secondary">Get in Touch</a>
                    </div>
                )}
            </nav>

            {/* B. HERO */}
            <section className="animate-section min-h-screen flex flex-col justify-center pt-24 pb-12 relative border-b-2 border-primary">
                {/* Decorative Grid Background */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-20 dark:opacity-10" style={{ backgroundImage: 'radial-gradient(var(--color-primary) 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>

                <div className="max-w-5xl mx-auto px-6 relative z-10 w-full">
                    <h1 className="gsap-reveal font-display text-7xl md:text-[9rem] leading-[0.85] uppercase tracking-tighter text-primary break-words">Jonathan <br /><span className="text-accent underline decoration-8 underline-offset-8">Gao</span></h1>
                    <h2 className="gsap-reveal text-3xl md:text-5xl font-bold mt-8 tracking-tight uppercase flex flex-wrap gap-x-3 items-baseline">
                        <span className="font-display">SOFTWARE</span> <span className="font-serif italic font-light text-accent-secondary normal-case">Engineer</span>
                    </h2>
                    <p className="gsap-reveal text-base md:text-lg text-primary mt-6 max-w-xl leading-relaxed border-l-4 border-accent pl-4 font-medium bg-background/80 p-2">
                        Currently building data infrastructure at Databricks. Previously led the DynamoDB replication protocol migration at AWS — 80M+ partitions, multi-petabyte scale.
                    </p>
                    <div className="gsap-reveal mt-10 flex items-center gap-4">
                        <a href="#experience" className="bg-primary text-background shadow-brutal border-2 border-primary px-6 py-3 text-sm font-display uppercase tracking-widest hover:bg-accent hover:text-primary hover:shadow-brutal-hover transition-all duration-150 flex items-center gap-2">
                            <span className="w-2 h-2 bg-accent-secondary rounded-full animate-pulse"></span> View My Work
                        </a>
                        <a href="https://github.com/nahtonaj" target="_blank" rel="noopener noreferrer" className="p-3 text-primary bg-surface border-2 border-primary shadow-brutal hover:bg-accent hover:shadow-brutal-hover transition-all duration-150">
                            <Github size={20} strokeWidth={2.5} />
                        </a>
                        <a href="https://linkedin.com/in/jonathan-gao" target="_blank" rel="noopener noreferrer" className="p-3 text-primary bg-surface border-2 border-primary shadow-brutal hover:bg-accent hover:shadow-brutal-hover transition-all duration-150">
                            <Linkedin size={20} strokeWidth={2.5} />
                        </a>
                    </div>
                </div>
            </section>

            {/* MARQUEE */}
            <div className="w-[110vw] ml-[-5vw] bg-primary text-background py-3 border-y-2 border-primary shadow-brutal relative z-20 mb-24 overflow-hidden -rotate-2 top-[-10px]">
                <div className="flex animate-marquee whitespace-nowrap font-display text-4xl uppercase tracking-wider items-center gap-12">
                    <span className="text-accent">DATA INFRASTRUCTURE</span> <span className="font-serif italic normal-case text-background text-3xl">Distributed Systems</span>
                    <span className="text-accent">DATA INFRASTRUCTURE</span> <span className="font-serif italic normal-case text-background text-3xl">Distributed Systems</span>
                    <span className="text-accent">DATA INFRASTRUCTURE</span> <span className="font-serif italic normal-case text-background text-3xl">Distributed Systems</span>
                    <span className="text-accent">DATA INFRASTRUCTURE</span> <span className="font-serif italic normal-case text-background text-3xl">Distributed Systems</span>
                </div>
            </div>

            {/* Content area with tiled background — only after marquee */}
            <div className="relative">
                {/* Parallax Tiled Icon Background */}
                {(() => {
                    const icons = [
                        <Code key="i0" size={40} />, <Terminal key="i1" size={40} />, <Cpu key="i2" size={40} />,
                        <CircuitBoard key="i3" size={40} />, <Keyboard key="i4" size={40} />, <Mountain key="i5" size={40} />,
                        <Snowflake key="i6" size={40} />, <Gamepad2 key="i7" size={40} />, <Dumbbell key="i8" size={40} />,
                        <Dog key="i9" size={40} />, <Cat key="i10" size={40} />, <Car key="i11" size={40} />,
                    ];
                    const rows = 100;
                    const cols = 20;
                    return (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                            {/* Gradient fade-in at top */}
                            <div className="absolute top-0 left-0 w-full h-48 z-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, var(--color-background) 0%, transparent 100%)' }}></div>
                            <div className="parallax-tile-grid absolute -top-[10%] -left-[15%] w-[130%]" style={{ minHeight: '110%' }}>
                                {Array.from({ length: rows }).map((_, r) => (
                                    <div key={r} className="flex" style={{ marginLeft: r % 2 === 1 ? '5rem' : '0' }}>
                                        {Array.from({ length: cols }).map((_, c) => {
                                            const idx = (r * 7 + c * 3) % icons.length;
                                            return (
                                                <div
                                                    key={c}
                                                    className="flex-shrink-0 flex items-center justify-center text-border opacity-[0.5]"
                                                    style={{ width: '10rem', height: '8rem' }}
                                                >
                                                    {icons[idx]}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                <main className="max-w-5xl mx-auto px-6 relative z-10">

                    {/* C. EXPERIENCE */}
                    <section id="experience" className="animate-section py-24 relative">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 border-b-4 border-primary pb-4 gap-4 relative z-10">
                            <h2 className="gsap-reveal font-display text-5xl md:text-7xl uppercase tracking-tighter leading-none">Experience</h2>
                            <span className="gsap-reveal font-mono text-sm font-bold bg-accent text-primary px-2 py-1 border-2 border-primary">// WHERE I'VE WORKED</span>
                        </div>

                        <div className="flex flex-col gap-6">
                            {expData.map((exp, i) => (
                                <div key={i} className="gsap-reveal group relative bg-surface border-2 border-primary shadow-brutal p-6 md:p-8 transition-all duration-150 hover:shadow-brutal-hover hover:-translate-y-1 hover:bg-primary hover:text-background">
                                    <div className="flex flex-col md:flex-row justify-between items-baseline mb-3">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                            <span className="font-display text-2xl md:text-3xl uppercase tracking-wide group-hover:text-accent flex items-center gap-3">
                                                <div className="w-3 h-3 bg-accent hidden md:block group-hover:bg-accent-secondary border border-primary"></div>
                                                {exp.company}
                                            </span>
                                            <span className="hidden md:block font-serif italic text-muted text-xl group-hover:text-background/50">/</span>
                                            <span className="font-bold text-lg group-hover:text-background/90">{exp.role}</span>
                                        </div>
                                        <span className="font-mono text-xs font-bold text-primary bg-accent px-2 py-1 border-2 border-primary mt-3 md:mt-0 whitespace-nowrap group-hover:bg-accent-secondary">
                                            {exp.dates}
                                        </span>
                                    </div>
                                    <div className="font-mono text-sm font-bold text-muted mb-4 group-hover:text-accent-secondary">{exp.team}</div>
                                    <div className="text-base text-primary/80 leading-relaxed font-medium group-hover:text-background/80 max-w-3xl border-l-4 border-primary/20 pl-4 group-hover:border-accent">
                                        {exp.desc}
                                    </div>
                                    <div className="mt-6 flex flex-wrap gap-2">
                                        {exp.tags.map((tag, j) => (
                                            <span key={j} className="font-mono text-[11px] font-bold uppercase bg-background text-primary border-2 border-primary px-2 py-1 shadow-[2px_2px_0px_var(--color-primary)] group-hover:border-background group-hover:shadow-[2px_2px_0px_var(--color-background)]">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* D. PROJECTS */}
                    <section id="projects" className="animate-section py-24 relative overflow-hidden">

                        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 border-b-4 border-primary pb-4 gap-4 relative z-10">
                            <h2 className="gsap-reveal font-display text-5xl md:text-7xl uppercase tracking-tighter leading-none">Projects</h2>
                            <span className="gsap-reveal font-mono text-sm font-bold bg-accent-secondary text-primary px-2 py-1 border-2 border-primary">// THINGS I'VE BUILT</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {projData.map((proj, i) => {
                                const CardWrapper = proj.link ? 'a' : 'div';
                                const wrapperProps = proj.link ? { href: proj.link, target: "_blank", rel: "noopener noreferrer" } : {};

                                return (
                                    <CardWrapper
                                        key={i}
                                        {...wrapperProps}
                                        className={`gsap-reveal border-2 border-primary bg-surface flex flex-col h-full shadow-brutal hover:shadow-brutal-hover hover:-translate-y-1 transition-all duration-150 group ${!proj.link ? "cursor-default" : ""}`}
                                    >
                                        <div className="p-6 md:p-8 flex flex-col flex-grow relative bg-background group-hover:bg-primary transition-colors duration-150">
                                            <div className="flex items-start justify-between mb-4">
                                                <h3 className="font-display text-3xl uppercase tracking-wide group-hover:text-background">{proj.title}</h3>
                                                {proj.link && <ExternalLink size={24} strokeWidth={3} className="text-primary ml-2 shrink-0 group-hover:text-background" />}
                                            </div>
                                            <p className="text-base font-medium text-primary flex-grow leading-relaxed group-hover:text-background">{proj.desc}</p>
                                            <div className="mt-8 flex flex-wrap gap-2">
                                                {proj.tags.map((tag, j) => (
                                                    <span key={j} className="font-mono text-[11px] font-bold uppercase bg-surface text-primary border-2 border-primary px-2 py-1 shadow-[2px_2px_0px_var(--color-primary)] group-hover:bg-primary group-hover:text-background group-hover:border-background group-hover:shadow-[2px_2px_0px_var(--color-accent-secondary)]">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </CardWrapper>
                                );
                            })}
                        </div>
                    </section>

                    {/* E. PUBLICATIONS */}
                    <section id="publications" className="animate-section py-24">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 border-b-4 border-primary pb-4 gap-4">
                            <h2 className="gsap-reveal font-display text-5xl md:text-7xl uppercase tracking-tighter leading-none">Research</h2>
                            <span className="gsap-reveal font-mono text-sm font-bold bg-accent text-primary px-2 py-1 border-2 border-primary">// PUBLICATIONS</span>
                        </div>

                        <div className="flex flex-col border-2 border-primary shadow-brutal bg-surface">
                            {pubData.map((pub, i) => (
                                <div key={i} className="gsap-reveal border-b-2 border-primary p-6 md:p-8 last:border-0 hover:bg-primary hover:text-background transition-colors group">
                                    <a href={pub.url} target="_blank" rel="noopener noreferrer" className="font-bold text-xl leading-tight group-hover:text-accent transition-colors duration-150 inline-block mb-3">
                                        {pub.title}
                                    </a>
                                    <div className="font-mono text-sm font-bold text-primary/80 group-hover:text-accent-secondary flex flex-wrap items-center gap-3">
                                        <span className="bg-primary text-background px-2 py-0.5 border border-primary group-hover:bg-accent-secondary group-hover:text-primary group-hover:border-accent-secondary">{pub.venue}</span>
                                        <span>{pub.year}</span>
                                    </div>
                                    <div className="text-sm font-medium mt-4 text-muted group-hover:text-background/60">
                                        {pub.lab}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* F. ABOUT */}
                    <section id="about" className="animate-section py-24 relative">

                        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 border-b-4 border-primary pb-4 gap-4 relative z-10">
                            <h2 className="gsap-reveal font-display text-5xl md:text-7xl uppercase tracking-tighter leading-none">About</h2>
                            <span className="gsap-reveal font-mono text-sm font-bold bg-accent-secondary text-primary px-2 py-1 border-2 border-primary">// ORIGINS</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 p-8 border-2 border-primary shadow-brutal bg-surface">
                            <div className="col-span-1 md:col-span-3 space-y-6 text-base md:text-lg text-primary leading-relaxed font-medium">
                                <p className="gsap-reveal">
                                    I've known I wanted to become a programmer since I was 9.
                                </p>
                                <p className="gsap-reveal">
                                    Starting with a little netbook for Christmas, I've been fascinated with learning how computers work. Picking up a book of C# for dummies, I began teaching myself the basics. I started with fixing basic tech issues like WiFi, printers, Windows issues, and even managed to get macOSX onto my Acer notebook. In high school, I taught myself Java and Python through books and online courses.
                                </p>
                                <p className="gsap-reveal">
                                    Since getting into Cornell, I knew I wanted to broaden my technical skills. Deciding on ECE over CS, I was able to delve into the entire tech stack. I learned how to design circuits and my own PCBs, how microprocessors work and how a computer works from the ground up, how to design robust and good software with best practices, and the foundations of cloud and distributed computing. Throughout my education, I was adamant in learning everything from pure electrical engineering to full stack software engineering. With internships and experience everywhere in between, I am passionate about learning more.
                                </p>
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-6">
                                <div className="gsap-reveal flex flex-col p-4 border-2 border-primary bg-background shadow-[4px_4px_0px_var(--color-primary)]">
                                    <span className="font-mono text-xs font-bold uppercase text-accent-secondary mb-1 bg-primary px-2 py-1 w-max">Currently</span>
                                    <span className="font-bold">Software Engineer IV, Databricks</span>
                                </div>
                                <div className="gsap-reveal flex flex-col p-4 border-2 border-primary bg-background shadow-[4px_4px_0px_var(--color-primary)]">
                                    <span className="font-mono text-xs font-bold uppercase text-accent mb-1 bg-primary px-2 py-1 w-max">Based in</span>
                                    <span className="font-bold">Seattle, WA</span>
                                </div>
                                <div className="gsap-reveal flex flex-col p-4 border-2 border-primary bg-background shadow-[4px_4px_0px_var(--color-primary)]">
                                    <span className="font-mono text-xs font-bold uppercase text-accent-secondary mb-1 bg-primary px-2 py-1 w-max">Education</span>
                                    <span className="font-bold">Cornell — M.Eng. CS + B.S. ECE</span>
                                    <span className="text-sm font-medium text-muted mt-1">3.8 / 4.3 GPA</span>
                                </div>
                                <div className="gsap-reveal flex flex-col p-4 border-2 border-primary bg-background shadow-[4px_4px_0px_var(--color-primary)]">
                                    <span className="font-mono text-xs font-bold uppercase text-accent mb-1 bg-primary px-2 py-1 w-max">Honors</span>
                                    <span className="font-bold text-sm">National Merit Finalist <br /> Bloomberg Puzzle Race 1st (Cornell)</span>
                                </div>
                            </div>
                        </div>
                    </section>

                </main>

                {/* G. FOOTER */}
                <footer className="border-t-2 border-primary mt-12 py-12 bg-primary text-background">
                    <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex flex-col items-center md:items-start">
                            <div className="font-display text-3xl uppercase tracking-widest"><span className="text-accent">J</span>G.</div>
                            <div className="font-mono text-xs mt-2 text-background/60"> 2026 JONATHAN GAO</div>
                        </div>
                        <div className="flex items-center gap-4">
                            <a href="https://github.com/nahtonaj" target="_blank" rel="noopener noreferrer" className="p-3 bg-background text-primary border-2 border-transparent hover:bg-accent hover:border-primary hover:shadow-brutal hover:-translate-y-1 transition-all duration-150" aria-label="GitHub">
                                <Github size={24} strokeWidth={2.5} />
                            </a>
                            <a href="https://linkedin.com/in/jonathan-gao" target="_blank" rel="noopener noreferrer" className="p-3 bg-background text-primary border-2 border-transparent hover:bg-accent-secondary hover:border-primary hover:shadow-brutal hover:-translate-y-1 transition-all duration-150" aria-label="LinkedIn">
                                <Linkedin size={24} strokeWidth={2.5} />
                            </a>
                            <a href="mailto:jg992@cornell.edu" className="p-3 bg-background text-primary border-2 border-transparent hover:bg-accent hover:border-primary hover:shadow-brutal hover:-translate-y-1 transition-all duration-150" aria-label="Email">
                                <Mail size={24} strokeWidth={2.5} />
                            </a>
                        </div>
                    </div>
                </footer>
            </div>{/* end relative wrapper for tiled background */}
        </div>
    );
}
