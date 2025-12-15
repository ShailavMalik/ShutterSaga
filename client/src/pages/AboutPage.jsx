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
      className="group relative overflow-hidden rounded-2xl border border-indigo-100/70 bg-white backdrop-blur-xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(31,41,55,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(99,102,241,0.3)] hover:border-indigo-200">
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50" />

      {/* Shimmer effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      <div className="relative flex flex-col items-center text-center gap-4">
        {/* Avatar with animated gradient border */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full bg-linear-to-br from-indigo-400 via-purple-500 to-pink-500 animate-spin-slow opacity-75 blur-sm group-hover:opacity-100"
            style={{ animationDuration: "3s" }}
          />
          <div className="relative p-1 rounded-full bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full grid place-items-center text-white font-bold text-2xl sm:text-3xl bg-linear-to-br from-indigo-600 to-purple-600 shadow-lg group-hover:shadow-xl transition-shadow">
              {initials}
            </div>
          </div>
        </div>

        {/* Name and role */}
        <div className="space-y-1">
          <div className="font-bold text-lg sm:text-xl text-gray-900 group-hover:text-indigo-700 transition-colors">
            {name}
          </div>
          <div className="text-sm sm:text-base text-gray-600 font-medium">
            {role}
          </div>
        </div>

        {/* LinkedIn button with enhanced styling */}
        <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-indigo-200 bg-linear-to-r from-indigo-50 to-purple-50 text-indigo-700 text-sm font-semibold shadow-sm group-hover:border-indigo-400 group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
          <LinkedInIcon className="w-5 h-5" />
          <span>Connect on LinkedIn</span>
          <svg
            className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
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
        <section className="mt-8 sm:mt-12 rounded-3xl border-2 border-indigo-200/50 bg-linear-to-br from-indigo-50/80 via-purple-50/60 to-pink-50/40 p-6 sm:p-10 shadow-[0_12px_48px_rgba(99,102,241,0.15)]">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              Meet the Team
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              The creative minds behind ShutterSaga. Connect with us on
              LinkedIn!
            </p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 max-w-4xl mx-auto">
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
