# Personal Portfolio Builder — Clean Engineering Aesthetic

## Role

Act as a world-class frontend engineer who specializes in clean, high-performance personal portfolio sites. Your output should feel like it was built by a senior engineer who has taste — not a designer trying to be flashy. The result should feel fast, precise, readable, and authoritative. No cinematic effects, no luxury branding, no decorative noise. Every element earns its place.

**Reference aesthetic:** Linear.app, Vercel.com, Stripe.com, Raycast.com.

---

## Design System

### Palette — Light Mode Primary, Dark Mode Supported

| Role         | Light Mode  | Dark Mode   |
|--------------|-------------|-------------|
| Background   | `#FFFFFF`   | `#0A0A0A`   |
| Surface      | `#F5F5F5`   | `#111111`   |
| Border       | `#E5E5E5`   | `#222222`   |
| Primary Text | `#0A0A0A`   | `#FAFAFA`   |
| Muted Text   | `#737373`   | `#737373`   |
| Accent       | `#0070F3`   | `#0070F3`   |
| Accent Hover | `#0051CC`   | `#338EF7`   |

Implement dark mode via `prefers-color-scheme` media query + a manual toggle that applies a `dark` class to `<html>` and persists to `localStorage`.

### Typography

- **Primary font:** "Inter" (Google Fonts) for all text.
- **Mono font:** "JetBrains Mono" only for tech stack tag chips and inline code.
- **Scale:**
  - `text-[11px] tracking-widest uppercase font-semibold` — section labels
  - `text-sm` — body muted / metadata
  - `text-base` — body primary
  - `text-xl` — card titles
  - `text-3xl md:text-5xl font-bold` — section headings
  - `text-5xl md:text-7xl font-bold tracking-tight` — hero name
- No serif fonts. No italic as a stylistic choice. No dramatic size jumps.

### Spacing & Layout

- Max content width: `max-w-4xl mx-auto px-6`
- Vertical section rhythm: `py-24`
- Cards: `rounded-xl border border-border bg-surface p-6`
- No glass morphism. No noise overlays. No gradient section backgrounds.

### Interactions

- Links: `opacity-100 hover:opacity-70 transition-opacity duration-150`
- Cards: `hover:border-accent/40 transition-colors duration-150`
- Buttons: standard `hover:bg-accent/90` — no scale transforms, no magnetic effects
- Scroll animations: GSAP `y: 12, opacity: 0 → 1`, `duration: 0.5`, `stagger: 0.08`, `ease: 'power2.out'`. Subtle, not theatrical.

---

## Component Architecture

### A. NAVBAR

- `fixed top-0 w-full z-50 bg-white/90 dark:bg-black/90 backdrop-blur-sm border-b border-border`
- Left: `"Jonathan Gao"` in `text-sm font-semibold`
- Center (hidden on mobile): nav links `text-sm text-muted hover:text-primary` — Experience · Projects · Publications · About
- Right: dark mode toggle icon + `"Get in Touch"` as `border border-border rounded-lg px-4 py-1.5 text-sm hover:bg-surface transition-colors`
- Mobile: hamburger menu revealing a full-width dropdown with same links

### B. HERO

- `min-h-screen flex flex-col justify-center` — no background image, no gradient overlay
- Content block: `max-w-2xl`
- **Name:** `"Jonathan Gao"` — `text-5xl md:text-7xl font-bold tracking-tight`
- **Title:** `"Software Engineer"` — `text-xl text-muted font-normal mt-2`
- **One-liner:** `"Currently building data infrastructure at Databricks. Previously led the DynamoDB replication protocol migration at AWS — 80M+ partitions, multi-petabyte scale."` — `text-base text-muted mt-4 max-w-xl`
- **CTAs (mt-8 flex gap-3):**
  - Primary: `"View My Work"` → `href="#experience"` — `bg-primary text-white rounded-lg px-5 py-2.5 text-sm font-medium hover:bg-primary/90`
  - Icon buttons: GitHub (`github.com/nahtonaj`) + LinkedIn (`linkedin.com/in/jonathan-gao`) — `text-muted hover:text-primary`

### C. EXPERIENCE

- Section label: `"EXPERIENCE"`
- Section heading: `"Where I've Worked"`
- Layout: vertical list, no timeline dots or lines
- Each entry row (hover → subtle `bg-surface rounded-xl p-4 -mx-4 transition-colors duration-150`):
  ```
  [Company]  [Role Title]                          [Date range]
             [Team · Location] — text-sm text-muted
             [Description] — text-sm text-muted mt-1
             [Tag chips] — mt-3
  ```
- Tag chips: `font-mono text-[11px] bg-background border border-border rounded-md px-2 py-0.5`

```js
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
```

### D. PROJECTS

- Section label: `"PROJECTS"`
- Section heading: `"Things I've Built"`
- Layout: `grid grid-cols-1 md:grid-cols-2 gap-4`
- Each card: `rounded-xl border border-border bg-surface p-6 hover:border-accent/40 transition-colors duration-150`
- Card anatomy: title (`font-semibold text-base`) + optional external link icon (Lucide `ExternalLink`, 14px) → description (`text-sm text-muted mt-2`) → tag chips (`mt-4`)

```js
const projData = [
  {
    title: "Snake Game on ARM Microprocessor",
    tags: ["K64F ARM", "C/C++", "Assembly", "Embedded"],
    desc: "Recreated Snake from scratch on a K64F ARM microcontroller with a 64×64 LED matrix, tick-based game loop via hardware interrupts, and accelerometer tilt controls.",
    link: null
  },
  {
    title: "Cornell FSAE — LV Fusebox & ECU",
    tags: ["Altium", "PCB Design", "CAN Bus", "EE"],
    desc: "Designed the low-voltage fusebox PCB for Cornell's Formula SAE electric racing vehicle. Co-developed the ECU handling telemetry, safety loops, and motor controller CAN comms.",
    link: "https://cornellfsae.com/"
  },
  {
    title: "Neural Network RC Car",
    tags: ["Python", "OpenCV", "PyBrain", "Raspberry Pi"],
    desc: "End-to-end autonomous driving model using a neural network and OpenCV for lane detection, deployed on an embedded Raspberry Pi controlling a physical RC car.",
    link: null
  },
  {
    title: "Juul.io — BigRed\\Hacks 2019",
    tags: ["Arduino", "IoT", "Best Hardware Award"],
    desc: "Best Hardware Implementation winner at BigRed\\Hacks 2019. An IoT Arduino-based hardware hack designed and judged in under 24 hours.",
    link: null
  },
];
```

### E. PUBLICATIONS

- Section label: `"PUBLICATIONS"`
- Section heading: `"Research"`
- Layout: simple vertical list, no cards
- Each entry:
  - Title: `font-medium text-base hover:text-accent transition-colors cursor-pointer` (links to DOI)
  - Venue + year: `text-sm text-muted mt-0.5`
  - Lab: `text-xs text-muted mt-0.5`
  - Divider: `border-b border-border` between entries

```js
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
```

### F. ABOUT

- Section label: `"ABOUT"`
- Section heading: `"About"`
- Layout: `grid grid-cols-1 md:grid-cols-5 gap-12`
- **Bio (col-span-3):** Three short paragraphs:
  - "I've known I wanted to be a programmer since I was 9. A Christmas netbook and a C# book started it all."
  - "Since then I've gone from fixing WiFi and printers to designing PCBs, writing distributed consensus protocols, and migrating petabyte-scale databases at AWS — while finishing a dual degree in ECE and CS at Cornell."
  - "I care about systems that work at scale, code that's clear to the next engineer, and shipping things that matter."
- **Facts panel (col-span-2):** labeled rows in `text-sm`, label in `text-muted text-xs uppercase tracking-wide`:
  - **Currently:** Software Engineer IV, Databricks
  - **Based in:** Seattle, WA
  - **Education:** Cornell — M.Eng. CS + B.S. ECE
  - **GPA:** 3.8 / 4.3
  - **Honors:** National Merit Finalist · Bloomberg Puzzle Race 1st (Cornell)
  - **Outside work:** Bouldering · Snowboarding · Sim Racing · Custom Keyboards · Gym

### G. FOOTER

- `border-t border-border py-10`
- Flex row: left `"© 2026 Jonathan Gao"` in `text-sm text-muted` | right: GitHub, LinkedIn, Email icon buttons in `text-muted hover:text-primary transition-colors`
- No tagline, no status indicator

---

## Technical Requirements

- **Stack:** React 18/19, Tailwind CSS v3.4+, GSAP 3 (with ScrollTrigger), Lucide React
- **Build:** Vite + PostCSS. Match the existing `vite.config.js` and `postcss.config.js` in the repo root exactly. Do not modify these files.
- **Output:** Entire site in `src/App.jsx` + `src/index.css`. Single-file component architecture — do NOT split into separate component files.
- **Deployment:** Output must build to `dist/` and be compatible with the existing `.github/workflows/` GitHub Pages deployment pipeline.
- **Dark mode:** `prefers-color-scheme` default + manual `dark` class toggle on `<html>`, persisted to `localStorage`.
- **Responsive:** Mobile-first. All grids collapse to single column below `md:`. Hamburger nav on mobile.
- **No contact form.** All contact CTAs use `mailto:jg992@cornell.edu`.
- **All external links:** `target="_blank" rel="noopener noreferrer"`.
- **Links:**
  - GitHub: `https://github.com/nahtonaj`
  - LinkedIn: `https://linkedin.com/in/jonathan-gao`
  - Email: `jg992@cornell.edu`
- **No placeholder text.** All copy is specified above — use it verbatim. Do not generate new content.
- **No heavy assets.** No background images, no video, no external icon CDNs beyond Lucide React.
