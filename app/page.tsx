export default function Home() {
  const features = [
    {
      icon: "👤",
      title: "Patient Registration & Login",
      description: "Secure accounts for patients to manage their appointments and health records.",
    },
    {
      icon: "📅",
      title: "Appointment Booking",
      description: "Effortless booking flow to schedule visits with the right doctor at the right time.",
    },
    {
      icon: "🩺",
      title: "Doctor Dashboard",
      description: "A clear schedule view for doctors to manage their day without the clutter.",
    },
    {
      icon: "🔄",
      title: "Cancellation & Rescheduling",
      description: "Flexible options to cancel or move appointments without friction.",
    },
    {
      icon: "🔔",
      title: "SMS & Email Reminders",
      description: "Automated reminders to keep both patients and doctors informed and on time.",
    },
    {
      icon: "📊",
      title: "Analytics & Insights",
      description: "Understand appointment trends and clinic performance through simple reports.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* Top bar */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-2xl">🏥</span>
            <span className="text-xl font-semibold tracking-tight text-gray-900">HealthMate</span>
          </div>
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">
            Launching Soon
          </p>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-18 pb-12 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex flex-col items-center gap-2 border-2 border-dashed border-blue-200 rounded-2xl px-8 py-4 bg-blue-50 mb-8">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🚧</span>
              <span className="text-2xl font-bold text-blue-600 tracking-tight">Coming Soon</span>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight text-gray-900 mb-6">
            Smarter Scheduling for
            <span className="text-blue-600"> Clinics & Patients</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            HealthMate is a modern appointment scheduling system designed to reduce wait times, eliminate double bookings, and keep everyone informed — patients and doctors alike.
          </p>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <hr className="border-gray-100" />
      </div>

      {/* What's coming */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">What we are building</h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
              A full-featured clinic scheduling platform designed for real-world healthcare workflows.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="border border-gray-100 rounded-xl p-6 bg-white hover:shadow-sm transition-shadow"
              >
                <div className="text-2xl mb-4">{feature.icon}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-6">
        <hr className="border-gray-100" />
      </div>

      {/* Mission */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Why HealthMate?</h2>
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
            Missed appointments cost clinics time and patients peace of mind. HealthMate is being built to fix that — with smart conflict detection, automated reminders, and a dashboard that gives doctors full visibility into their schedule without any of the administrative overhead.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <span>🏥</span>
            <span className="font-medium text-gray-600">HealthMate</span>
          </div>
          <p>© 2026 HealthMate · Appointment Scheduler · Coming Soon</p>
        </div>
      </footer>

    </div>
  );
}
