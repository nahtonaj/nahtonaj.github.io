import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Github, Linkedin, Mail, ExternalLink, ArrowRight, Activity } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// --- NAVBAR ---
function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 rounded-full px-6 py-3 flex items-center justify-between w-[90%] max-w-3xl ${scrolled ? 'bg-background/80 backdrop-blur-xl border border-text-dark/10 shadow-lg text-text-dark' : 'bg-transparent text-background'}`}>
            <div className="font-heading font-bold text-lg tracking-tight">JG.</div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                <a href="#experience" className="hover:-translate-y-[1px] transition-transform">Experience</a>
                <a href="#projects" className="hover:-translate-y-[1px] transition-transform">Projects</a>
                <a href="#publications" className="hover:-translate-y-[1px] transition-transform">Publications</a>
                <a href="#about" className="hover:-translate-y-[1px] transition-transform">About</a>
            </div>
            <a href="mailto:jg992@cornell.edu" className="group relative overflow-hidden rounded-full bg-accent text-primary px-5 py-2 text-sm font-semibold transition-transform hover:scale-[1.03] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]">
                <span className="relative z-10 flex items-center gap-2">Get in Touch</span>
            </a>
        </nav>
    );
}

// --- HERO ---
function Hero() {
    const heroRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.hero-elem', {
                y: 40,
                opacity: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: 'power3.out',
                delay: 0.2
            });
        }, heroRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={heroRef} className="relative h-[100dvh] w-full flex items-end pb-24 px-8 md:px-16 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1600607688066-890987f18a86?auto=format&fit=crop&q=80"
                    alt="Dark architectural marble"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/20"></div>
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-start gap-2 md:gap-4">
                <div className="overflow-hidden">
                    <h1 className="hero-elem font-heading font-bold text-5xl md:text-7xl lg:text-8xl text-background tracking-tighter leading-none">
                        Engineering is the
                    </h1>
                </div>
                <div className="overflow-hidden">
                    <span className="hero-elem font-drama italic text-accent text-7xl md:text-9xl lg:text-[11rem] leading-none pr-4">
                        Craft.
                    </span>
                </div>
                <div className="overflow-hidden mt-6">
                    <p className="hero-elem font-heading text-lg md:text-xl text-background/80 max-w-2xl font-light">
                        Software Engineer IV at Databricks. Previously AWS DynamoDB.
                    </p>
                </div>
            </div>
        </section>
    );
}

// --- EXPERIENCE ---
const expData = [
    { company: "Databricks", role: "Software Engineer IV", dates: "2025–Present", desc: "Building scalable backend systems and processing large-scale data." },
    { company: "AWS DynamoDB", role: "Software Engineer II", dates: "2021–2025", desc: "Designed and implemented replication and leader election protocols for a multi-year migration replacing Paxos. Scaled rollout to 80+ million partitions worldwide across multi-petabyte tables." },
    { company: "Amazon Alexa", role: "SDE Intern -> SDE I", dates: "2020–2022", desc: "Owned service for test data intake and visualization built with Spring Boot. Owned data lake service parsing and fetching data using Lambda, Glue, Batch, and S3." },
    { company: "MathWorks", role: "EDG Intern, Software Engineering", dates: "Summer 2019", desc: "Developed a new scalable, cost-efficient USB over network framework for hardware testing, dramatically reducing time to write tests." },
    { company: "InServe", role: "Lead Full-Stack SWE Intern", dates: "Summer 2018", desc: "Led full-stack engineering efforts for core application systems." },
    { company: "Cornell Reesink Lab", role: "Research Assistant", dates: "2019–2020", desc: "Worked on a study using computer vision and machine learning (CT scans) to detect parameters indicating bone fracture in horses." },
    { company: "Stony Brook Lab", role: "Research Assistant", dates: "2016–2017", desc: "Designed a computational model supporting a new theory for fear regulation in the brain." },
];

function Experience() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.exp-card', {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 70%',
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power2.out'
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section id="experience" ref={sectionRef} className="py-32 px-8 md:px-16 bg-primary text-background">
            <div className="max-w-4xl mx-auto">
                <h2 className="font-heading font-semibold text-3xl md:text-5xl mb-16 tracking-tight">Professional Timeline</h2>

                <div className="relative border-l border-accent/20 pl-8 ml-4 space-y-16">
                    {expData.map((exp, i) => (
                        <div key={i} className="exp-card relative group">
                            {/* Timeline dot */}
                            <div className="absolute -left-[37px] top-1.5 w-3 h-3 rounded-full bg-accent/50 group-hover:bg-accent transition-colors duration-300 ring-4 ring-primary"></div>

                            <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-2">
                                <h3 className="font-heading font-bold text-2xl text-background">{exp.company}</h3>
                                <span className="font-data text-accent/80 text-sm mt-1 md:mt-0">{exp.dates}</span>
                            </div>
                            <h4 className="font-heading text-lg text-background/60 mb-4">{exp.role}</h4>
                            <p className="font-heading text-background/80 leading-relaxed font-light">{exp.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// --- PROJECTS ---
const projData = [
    { title: "Snake Game", subtitle: "Embedded Systems, C/C++", desc: "Recreated the classic snake game controlled with an accelerometer using a K64F ARM microcontroller and 64x64 LED matrix." },
    { title: "Cornell FSAE LV Fusebox", subtitle: "PCB Design, EE", desc: "Designed low-voltage fusebox architecture and custom PCB for the Cornell Formula SAE electric racing vehicle." },
    { title: "Cornell FSAE ECU", subtitle: "Electronics Control Unit", desc: "Co-developed the central MCU handling telemetry, safety loops, and motor controller CAN communications." },
    { title: "Neural Network RC Car", subtitle: "Python, OpenCV, Raspberry Pi", desc: "End-to-end autonomous driving model using PyBrain and OpenCV, deployed on an embedded Raspberry Pi architecture." },
    { title: "Juul.io", subtitle: "BigRed\\Hacks 2019 Winner", desc: "IoT/Arduino based hardware hack winning the best hardware implementation award." },
];

function Projects() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.proj-card', {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 70%',
                },
                y: 40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power2.out'
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section id="projects" ref={sectionRef} className="py-32 px-8 md:px-16 bg-background text-text-dark">
            <div className="max-w-6xl mx-auto">
                <h2 className="font-heading font-semibold text-3xl md:text-5xl mb-16 tracking-tight text-primary">Technical Projects</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projData.map((proj, i) => (
                        <div key={i} className="proj-card group p-8 rounded-[2rem] bg-white border border-text-dark/5 hover:border-accent/40 shadow-sm hover:shadow-xl transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:-translate-y-2 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-accent scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500"></div>
                            <h3 className="font-heading font-bold text-xl mb-2 group-hover:text-accent transition-colors">{proj.title}</h3>
                            <div className="font-data text-xs text-text-dark/50 mb-4">{proj.subtitle}</div>
                            <p className="font-heading text-sm text-text-dark/80 leading-relaxed font-light">{proj.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// --- PUBLICATIONS ---
const pubData = [
    { title: "A radiomics platform to differentiate parameters of bone fracture in horses", venue: "Equine Veterinary Journal", year: "2020" },
    { title: "From Anxious to Reckless: A computational model of fear regulation in the brain", venue: "Frontiers in Systems Neuroscience", year: "2017" },
];

function Publications() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.pub-card', {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 80%',
                },
                x: -40,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power2.out'
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section id="publications" ref={sectionRef} className="py-32 px-8 md:px-16 bg-primary text-background">
            <div className="max-w-4xl mx-auto">
                <h2 className="font-heading font-semibold text-3xl md:text-5xl mb-16 tracking-tight">Publications</h2>

                <div className="space-y-6">
                    {pubData.map((pub, i) => (
                        <a key={i} href="#" className="pub-card group block p-8 rounded-[2rem] bg-white/5 hover:bg-white/10 border border-white/5 hover:border-accent/30 transition-all duration-300">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="max-w-2xl">
                                    <h3 className="font-heading font-medium text-lg text-background/90 group-hover:text-accent transition-colors leading-snug">{pub.title}</h3>
                                    <div className="font-data text-sm mt-3 text-background/50 flex gap-3 items-center">
                                        <span>{pub.venue}</span>
                                        <span className="w-1 h-1 rounded-full bg-accent"></span>
                                        <span>{pub.year}</span>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-accent group-hover:text-primary transition-all group-hover:border-accent shrink-0">
                                    <ExternalLink size={16} />
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}

// --- ABOUT / PHILOSOPHY ---
function About() {
    const sectionRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.phi-text', {
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 60%',
                },
                y: 30,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: 'power3.out'
            });
        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section id="about" ref={sectionRef} className="relative py-40 px-8 md:px-16 bg-[#0a0a0e] text-background overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-20">
                <img src="https://images.unsplash.com/photo-1618221118493-9cfa1a1c00da?auto=format&fit=crop&q=80" alt="Texture" className="w-full h-full object-cover" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row gap-16 md:gap-8 items-start justify-between">

                <div className="flex-1 space-y-12">
                    <div>
                        <p className="phi-text font-heading text-xl text-background/60 mb-2">Most engineers focus on:</p>
                        <p className="phi-text font-heading text-3xl font-medium tracking-tight">Writing code to close tickets.</p>
                    </div>
                    <div>
                        <p className="phi-text font-heading text-xl text-background/60 mb-2">I focus on:</p>
                        <p className="phi-text font-drama italic text-5xl md:text-6xl text-accent leading-tight">
                            Building systems that <br />scale seamlessly.
                        </p>
                    </div>
                </div>

                <div className="flex-1 md:max-w-sm space-y-10">
                    <div className="phi-text">
                        <h4 className="font-data text-accent text-sm mb-4 uppercase tracking-widest border-b border-accent/20 pb-2">Education</h4>
                        <div className="space-y-4">
                            <div>
                                <p className="font-heading font-medium text-lg">Cornell University</p>
                                <p className="font-heading text-sm text-background/60 mt-1">M.Eng. Computer Science — 3.8 GPA</p>
                                <p className="font-heading text-sm text-background/60">B.S. Electrical & Computer Engineering</p>
                            </div>
                        </div>
                    </div>

                    <div className="phi-text">
                        <h4 className="font-data text-accent text-sm mb-4 uppercase tracking-widest border-b border-accent/20 pb-2">Technical Core</h4>
                        <p className="font-heading text-sm text-background/80 leading-relaxed font-light">
                            Java, Python, C/C++, TypeScript, React, Distributed Systems, Cloud Computing, Embedded Architectures.
                        </p>
                    </div>

                    <div className="phi-text">
                        <h4 className="font-data text-accent text-sm mb-4 uppercase tracking-widest border-b border-accent/20 pb-2">Personal</h4>
                        <div className="flex gap-4 font-heading text-sm text-background/60">
                            <span className="px-3 py-1 rounded-full bg-white/5">Working Out</span>
                            <span className="px-3 py-1 rounded-full bg-white/5">Dancing</span>
                            <span className="px-3 py-1 rounded-full bg-white/5">Gaming</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}

// --- FOOTER ---
function Footer() {
    return (
        <footer className="bg-primary text-background rounded-t-[4rem] px-8 md:px-16 py-16 mt-[-4rem] relative z-20 border-t border-white/5 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex flex-col items-center md:items-start tracking-tight">
                    <span className="font-heading font-bold text-2xl">Jonathan Gao</span>
                    <span className="font-data text-sm text-background/40 mt-1">Software Engineer</span>
                </div>

                <div className="flex gap-6">
                    <a href="https://linkedin.com/in/jonathan-gao" target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-accent hover:text-primary transition-all duration-300">
                        <Linkedin size={20} />
                    </a>
                    <a href="https://github.com/nahtonaj" target="_blank" rel="noreferrer" className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-accent hover:text-primary transition-all duration-300">
                        <Github size={20} />
                    </a>
                    <a href="mailto:jg992@cornell.edu" className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-accent hover:text-primary transition-all duration-300">
                        <Mail size={20} />
                    </a>
                </div>

                <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="font-data text-xs text-background/70 uppercase">System Operational</span>
                </div>
            </div>
        </footer>
    );
}

export default function App() {
    return (
        <div className="min-h-screen bg-background text-text-dark font-heading w-full selection:bg-accent/30 selection:text-accent">
            <Navbar />
            <Hero />
            <Experience />
            <Projects />
            <Publications />
            <About />
            <Footer />
        </div>
    );
}
