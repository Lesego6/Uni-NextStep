import { Link } from 'react-router-dom';
import { GraduationCap, Calculator, Search, Send, Activity, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: Calculator,
      title: 'APS Calculator',
      desc: 'Calculate your Admission Point Score using official NSC subject conversions.',
      color: 'bg-blue-50 text-primary'
    },
    {
      icon: Search,
      title: 'Course Matching',
      desc: 'Find courses you qualify for based on your APS and field of interest.',
      color: 'bg-teal-50 text-accent'
    },
    {
      icon: Send,
      title: 'One Application',
      desc: 'Apply to multiple universities through a single streamlined process.',
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      icon: Activity,
      title: 'Track Status',
      desc: 'Monitor your application status across all institutions in real-time.',
      color: 'bg-amber-50 text-amber-600'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <GraduationCap className="w-10 h-10 text-accent" />
              <span className="text-accent font-heading font-bold text-xl">Uni NextStep</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6 leading-tight">
              Your Future Starts<br />With the Right <span className="text-accent">Next Step</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-xl">
              Navigate South African university admissions with confidence. Calculate your APS, discover qualifying courses, and track applications — all in one place.
            </p>
            <Link to="/auth" className="inline-flex items-center gap-2 btn-primary text-lg">
              Get Started
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">26</div>
              <div className="text-sm text-gray-500 mt-1">Universities</div>
            </div>
            <div className="w-px h-12 bg-gray-200 hidden md:block"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">100+</div>
              <div className="text-sm text-gray-500 mt-1">Courses</div>
            </div>
            <div className="w-px h-12 bg-gray-200 hidden md:block"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">Free</div>
              <div className="text-sm text-gray-500 mt-1">Always</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold mb-3">Everything You Need</h2>
            <p className="text-gray-500 max-w-lg mx-auto">From APS calculation to application tracking, we've got your university journey covered.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="card hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">Ready to Find Your Path?</h2>
          <p className="text-gray-500 mb-8">Join thousands of South African students using Uni NextStep to plan their academic future.</p>
          <Link to="/auth" className="btn-primary inline-flex items-center gap-2">
            Create Free Account
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-6 h-6 text-accent" />
            <span className="font-heading font-bold">Uni NextStep</span>
          </div>
          <p className="text-sm text-blue-200">Empowering South African students since 2025</p>
        </div>
      </footer>
    </div>
  );
}