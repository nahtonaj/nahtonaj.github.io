import React, { useEffect, useState, useRef } from 'react';
import { Github, Linkedin, ExternalLink, Moon, Sun, Menu, X, Mail } from 'lucide-react';
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
        image: "/images/snake.png"
    },
    {
        title: "Cornell FSAE — LV Fusebox & ECU",
        tags: ["Altium", "PCB Design", "CAN Bus", "EE"],
        desc: "Designed the low-voltage fusebox PCB for Cornell's Formula SAE electric racing vehicle. Co-developed the ECU handling telemetry, safety loops, and motor controller CAN comms.",
        link: "https://cornellfsae.com/",
        image: "/images/fsaecar.png"
    },
    {
        title: "Neural Network RC Car",
        tags: ["Python", "OpenCV", "PyBrain", "Raspberry Pi"],
        desc: "End-to-end autonomous driving model using a neural network and OpenCV for lane detection, deployed on an embedded Raspberry Pi controlling a physical RC car.",
        link: null,
        image: "/images/nnrccar.jpg"
    },
    {
        title: "Juul.io — BigRed\\Hacks 2019",
        tags: ["Arduino", "IoT", "Best Hardware Award"],
        desc: "Best Hardware Implementation winner at BigRed\\Hacks 2019. An IoT Arduino-based hardware hack designed and judged in under 24 hours.",
        link: null,
        image: "/images/juulio.jpg"
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

    useEffect(() => {
        // Initial theme check
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
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

    useEffect(() => {
        // Setup scroll reveal animations
        const ctx = gsap.context(() => {
            const sections = gsap.utils.toArray('section.animate-section');
            sections.forEach((sec) => {
                const elements = sec.querySelectorAll('.gsap-reveal');
                if (elements.length > 0) {
                    gsap.from(elements, {
                        scrollTrigger: {
                            trigger: sec,
                            start: 'top 85%',
                        },
                        y: 12,
                        opacity: 0,
                        duration: 0.5,
                        stagger: 0.08,
                        ease: 'power2.out',
                    });
                }
            });
        }, mainRef);
        return () => ctx.revert();
    }, []);

    return (
        <div ref={mainRef} className="font-sans text-primary w-full overflow-hidden relative">
            {/* FLUID BACKGROUND */}
            <div className="fixed inset-0 z-[-1] overflow-hidden bg-background pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-accent/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-accent/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-accent/5 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000"></div>
            </div>

            {/* A. NAVBAR */}
            <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-sm border-b border-border transition-colors duration-150">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="font-semibold text-sm">Jonathan Gao</div>

                    <div className="hidden md:flex items-center space-x-6">
                        <a href="#experience" className="text-sm text-muted hover:text-primary transition-opacity duration-150">Experience</a>
                        <a href="#projects" className="text-sm text-muted hover:text-primary transition-opacity duration-150">Projects</a>
                        <a href="#publications" className="text-sm text-muted hover:text-primary transition-opacity duration-150">Publications</a>
                        <a href="#about" className="text-sm text-muted hover:text-primary transition-opacity duration-150">About</a>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button onClick={toggleDarkMode} className="text-muted hover:text-primary transition-opacity duration-150" aria-label="Toggle Dark Mode">
                            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <a href="mailto:jg992@cornell.edu" className="hidden md:flex border border-border rounded-lg px-4 py-1.5 text-sm hover:bg-surface transition-colors duration-150">
                            Get in Touch
                        </a>
                        <button className="md:hidden text-muted" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navbar Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-border bg-background px-6 py-4 flex flex-col space-y-4 shadow-lg">
                        <a href="#experience" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted hover:text-primary transition-opacity duration-150">Experience</a>
                        <a href="#projects" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted hover:text-primary transition-opacity duration-150">Projects</a>
                        <a href="#publications" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted hover:text-primary transition-opacity duration-150">Publications</a>
                        <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-sm text-muted hover:text-primary transition-opacity duration-150">About</a>
                        <a href="mailto:jg992@cornell.edu" onClick={() => setMobileMenuOpen(false)} className="text-sm text-primary font-medium">Get in Touch</a>
                    </div>
                )}
            </nav>

            <main className="max-w-4xl mx-auto px-6">

                {/* B. HERO */}
                <section className="animate-section min-h-screen flex flex-col justify-center pt-16">
                    <div className="max-w-2xl">
                        <h1 className="gsap-reveal text-5xl md:text-7xl font-bold tracking-tight">Jonathan Gao</h1>
                        <h2 className="gsap-reveal text-xl text-muted font-normal mt-2">Software Engineer</h2>
                        <p className="gsap-reveal text-base text-muted mt-4 max-w-xl leading-relaxed">
                            Currently building data infrastructure at Databricks. Previously led the DynamoDB replication protocol migration at AWS — 80M+ partitions, multi-petabyte scale.
                        </p>
                        <div className="gsap-reveal mt-8 flex items-center gap-3">
                            <a href="#experience" className="bg-primary text-background rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity duration-150">
                                View My Work
                            </a>
                            <a href="https://github.com/nahtonaj" target="_blank" rel="noopener noreferrer" className="p-2.5 text-muted hover:text-primary transition-colors duration-150 rounded-lg hover:bg-surface">
                                <Github size={20} />
                            </a>
                            <a href="https://linkedin.com/in/jonathan-gao" target="_blank" rel="noopener noreferrer" className="p-2.5 text-muted hover:text-primary transition-colors duration-150 rounded-lg hover:bg-surface">
                                <Linkedin size={20} />
                            </a>
                        </div>
                    </div>
                </section>

                {/* C. EXPERIENCE */}
                <section id="experience" className="animate-section py-24">
                    <p className="gsap-reveal text-[11px] tracking-widest uppercase font-semibold text-muted mb-3">Experience</p>
                    <h2 className="gsap-reveal text-3xl md:text-5xl font-bold mb-12">Where I've Worked</h2>

                    <div className="flex flex-col space-y-2">
                        {expData.map((exp, i) => (
                            <div key={i} className="gsap-reveal group hover:bg-surface rounded-xl p-4 -mx-4 transition-colors duration-150">
                                <div className="flex flex-col md:flex-row justify-between items-baseline mb-1">
                                    <div>
                                        <span className="font-semibold text-base">{exp.company}</span>
                                        <span className="text-muted mx-2">·</span>
                                        <span className="text-base">{exp.role}</span>
                                    </div>
                                    <span className="text-sm text-muted mt-1 md:mt-0 whitespace-nowrap">{exp.dates}</span>
                                </div>
                                <div className="text-sm text-muted mb-3">{exp.team}</div>
                                <div className="text-sm text-muted leading-relaxed">{exp.desc}</div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {exp.tags.map((tag, j) => (
                                        <span key={j} className="font-mono text-[11px] bg-background border border-border rounded-md px-2 py-0.5 text-muted">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* D. PROJECTS */}
                <section id="projects" className="animate-section py-24">
                    <p className="gsap-reveal text-[11px] tracking-widest uppercase font-semibold text-muted mb-3">Projects</p>
                    <h2 className="gsap-reveal text-3xl md:text-5xl font-bold mb-12">Things I've Built</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projData.map((proj, i) => {
                            const CardWrapper = proj.link ? 'a' : 'div';
                            const wrapperProps = proj.link ? { href: proj.link, target: "_blank", rel: "noopener noreferrer" } : {};

                            return (
                                <CardWrapper
                                    key={i}
                                    {...wrapperProps}
                                    className={`gsap-reveal rounded-xl border border-border bg-surface flex flex-col h-full overflow-hidden hover:border-accent/40 transition-colors duration-150 group ${!proj.link ? "cursor-default" : ""}`}
                                >
                                    {proj.image && (
                                        <div className="w-full h-48 sm:h-56 border-b border-border overflow-hidden bg-background shrink-0">
                                            <img src={proj.image} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                                        </div>
                                    )}
                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold text-base">{proj.title}</h3>
                                            {proj.link && <ExternalLink size={14} className="text-muted ml-2 mt-1 shrink-0" />}
                                        </div>
                                        <p className="text-sm text-muted flex-grow leading-relaxed">{proj.desc}</p>
                                        <div className="mt-6 flex flex-wrap gap-2">
                                            {proj.tags.map((tag, j) => (
                                                <span key={j} className="font-mono text-[11px] bg-background text-muted border border-border rounded-md px-2 py-0.5">
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
                    <p className="gsap-reveal text-[11px] tracking-widest uppercase font-semibold text-muted mb-3">Publications</p>
                    <h2 className="gsap-reveal text-3xl md:text-5xl font-bold mb-12">Research</h2>

                    <div className="flex flex-col">
                        {pubData.map((pub, i) => (
                            <div key={i} className="gsap-reveal border-b border-border py-6 last:border-0 last:pb-0 first:pt-0">
                                <a href={pub.url} target="_blank" rel="noopener noreferrer" className="font-medium text-base hover:text-accent transition-colors duration-150 inline-block">
                                    {pub.title}
                                </a>
                                <div className="text-sm text-muted mt-2">
                                    {pub.venue}, {pub.year}
                                </div>
                                <div className="text-xs text-muted mt-1 flex items-center justify-between">
                                    <span>{pub.lab}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* F. ABOUT */}
                <section id="about" className="animate-section py-24">
                    <p className="gsap-reveal text-[11px] tracking-widest uppercase font-semibold text-muted mb-3">About</p>
                    <h2 className="gsap-reveal text-3xl md:text-5xl font-bold mb-12">About</h2>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
                        <div className="col-span-1 md:col-span-3 space-y-5 text-base text-primary leading-relaxed">
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
                            <div className="gsap-reveal flex flex-col">
                                <span className="text-muted text-xs uppercase tracking-wide font-semibold mb-1">Currently</span>
                                <span className="text-sm">Software Engineer IV, Databricks</span>
                            </div>
                            <div className="gsap-reveal flex flex-col">
                                <span className="text-muted text-xs uppercase tracking-wide font-semibold mb-1">Based in</span>
                                <span className="text-sm">Seattle, WA</span>
                            </div>
                            <div className="gsap-reveal flex flex-col">
                                <span className="text-muted text-xs uppercase tracking-wide font-semibold mb-1">Education</span>
                                <span className="text-sm">Cornell — M.Eng. CS + B.S. ECE</span>
                            </div>
                            <div className="gsap-reveal flex flex-col">
                                <span className="text-muted text-xs uppercase tracking-wide font-semibold mb-1">GPA</span>
                                <span className="text-sm">3.8 / 4.3</span>
                            </div>
                            <div className="gsap-reveal flex flex-col">
                                <span className="text-muted text-xs uppercase tracking-wide font-semibold mb-1">Honors</span>
                                <span className="text-sm">National Merit Finalist · Bloomberg Puzzle Race 1st (Cornell)</span>
                            </div>
                            <div className="gsap-reveal flex flex-col">
                                <span className="text-muted text-xs uppercase tracking-wide font-semibold mb-1">Outside work</span>
                                <span className="text-sm leading-relaxed">Bouldering · Snowboarding · Sim Racing · Custom Keyboards · Gym</span>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            {/* G. FOOTER */}
            <footer className="border-t border-border mt-12 py-10 transition-colors duration-150">
                <div className="max-w-4xl mx-auto px-6 flex flex-col-reverse md:flex-row items-center justify-between gap-6">
                    <div className="text-sm text-muted">
                        2026 Jonathan Gao
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="https://github.com/nahtonaj" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors duration-150" aria-label="GitHub">
                            <Github size={20} />
                        </a>
                        <a href="https://linkedin.com/in/jonathan-gao" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors duration-150" aria-label="LinkedIn">
                            <Linkedin size={20} />
                        </a>
                        <a href="mailto:jg992@cornell.edu" className="text-muted hover:text-primary transition-colors duration-150" aria-label="Email">
                            <Mail size={20} />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
