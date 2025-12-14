// Tailwind styles used directly in JSX

function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-20 sm:pb-8">
      <div className="rounded-2xl sm:rounded-3xl bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] p-5 sm:p-8 md:p-10 border border-gray-200">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-linear-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
          About ShutterSaga
        </h1>
        <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
          A photo story built as an MCA 3rd semester project, crafted with care
          by Shailav Malik and Sakshi Poonia.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 bg-linear-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-linear-to-r from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm sm:text-base">
              SM
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm sm:text-base">
                Shailav Malik
              </p>
              <a
                href="https://www.linkedin.com/in/shailavmalik"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-700 hover:underline text-xs sm:text-sm">
                LinkedIn Profile
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-linear-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-linear-to-r from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white text-sm sm:text-base">
              SP
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm sm:text-base">
                Sakshi Poonia
              </p>
              <a
                href="https://www.linkedin.com/in/sakshi-poonia-751355370/"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-700 hover:underline text-xs sm:text-sm">
                LinkedIn Profile
              </a>
            </div>
          </div>
        </div>
        <div className="text-gray-500 text-sm sm:text-base">
          Developed as a modern, secure photo storage experience.
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
