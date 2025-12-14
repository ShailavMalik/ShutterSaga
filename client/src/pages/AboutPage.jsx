// About page redesigned with a clean, card-based layout

function Feature({ icon, title, description }) {
  return (
    <div className="group rounded-xl border border-indigo-100/60 bg-white/70 backdrop-blur-xl p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.18)] transition-all">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-white grid place-items-center text-lg">
          {icon}
        </div>
        <div>
          <div className="font-semibold text-gray-900">{title}</div>
          <p className="text-gray-600 text-sm mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function LinkedInIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={props.className || "w-4 h-4"}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.036-1.852-3.036-1.853 0-2.136 1.447-2.136 2.943v5.662H9.35V9h3.414v1.561h.049c.476-.9 1.637-1.852 3.369-1.852 3.6 0 4.266 2.37 4.266 5.456v6.287zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM6.999 20.452H3.67V9h3.329v11.452z" />
    </svg>
  );
}

function Contributor({ initials, name, role, link }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="group relative overflow-hidden rounded-2xl border border-indigo-100/70 bg-white/90 backdrop-blur-xl p-5 sm:p-6 shadow-[0_10px_40px_rgba(31,41,55,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_56px_rgba(99,102,241,0.25)]">
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(600px_circle_at_var(--x,50%)_var(--y,50%),rgba(99,102,241,0.08),transparent_40%)] pointer-events-none" />
      <div className="flex items-center gap-4">
        <div className="p-0.5 rounded-full bg-linear-to-br from-indigo-500 to-pink-500">
          <div className="w-14 h-14 rounded-full grid place-items-center text-white font-semibold bg-linear-to-br from-indigo-500 to-purple-600">
            {initials}
          </div>
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 truncate">{name}</div>
          <div className="text-sm text-gray-600">{role}</div>
          <div className="mt-2 inline-flex items-center gap-2 text-indigo-600 text-sm">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-indigo-200/70 bg-indigo-50/60 group-hover:bg-indigo-50">
              <LinkedInIcon />
              <span className="font-medium">LinkedIn</span>
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[linear-gradient(135deg,#eef2ff,25%,#faf5ff_60%,#fff)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header card */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-gray-200 shadow-[0_12px_48px_rgba(0,0,0,0.06)] p-6 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
            About ShutterSaga
          </h1>
          <p className="mt-3 text-gray-700 text-base sm:text-lg leading-relaxed max-w-3xl">
            ShutterSaga is an MCA 3rd semester mini project that explores the
            design of a secure, scalable photo storage and sharing application.
            It demonstrates end‑to‑end engineering practices—from cloud storage
            to CI/CD—implemented with a practical, academic-friendly approach.
          </p>

          {/* Highlights */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Feature
              icon={<span>☁️</span>}
              title="Azure Blob Storage"
              description="Reliable object storage for images with efficient uploads and retrieval."
            />
            <Feature
              icon={<span>🛡️</span>}
              title="Security First"
              description="JWT auth, rate limiting, and hardened headers for safer access."
            />
            <Feature
              icon={<span>⚙️</span>}
              title="CI/CD"
              description="GitHub Actions for lint, tests, and automated deploys to Vercel/Render."
            />
            <Feature
              icon={<span>💾</span>}
              title="Node.js + MongoDB"
              description="Express APIs backed by MongoDB with clean data models."
            />
          </div>
        </div>

        {/* Contributors - separate highlighted section */}
        <section className="mt-8 sm:mt-12 rounded-3xl border border-indigo-100/60 bg-linear-to-br from-indigo-50 via-purple-50 to-white p-5 sm:p-8 shadow-[0_12px_48px_rgba(99,102,241,0.12)]">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Contributors</h2>
            <p className="text-gray-600 text-sm max-w-xl">
              Core team behind ShutterSaga. Hover to explore and connect.
            </p>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Contributor
              initials="SM"
              name="Shailav Malik"
              role="Full‑stack Developer"
              link="https://www.linkedin.com/in/shailavmalik"
            />
            <Contributor
              initials="SP"
              name="Sakshi Poonia"
              role="Full‑stack Developer"
              link="https://www.linkedin.com/in/sakshi-poonia-751355370/"
            />
          </div>
        </section>

        {/* Closing note */}
        <div className="mt-10 border-t pt-6 border-gray-200">
          <p className="text-gray-700 max-w-3xl leading-relaxed">
            Built with scalability in mind—ShutterSaga can evolve with features
            like collaborative albums, AI-powered tagging, and granular sharing
            controls. The current architecture provides a strong foundation for
            future enhancements.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
