import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  CheckCircle, 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  Users, 
  Clock,
  Menu,
  X
} from "lucide-react";

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 px-4 py-3 backdrop-blur-md sm:px-6 md:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-amber-700 sm:text-2xl">SAKOSILE</h1>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="transition-colors hover:text-amber-700">Features</a>
            <a href="#about" className="transition-colors hover:text-amber-700">About</a>
            <a href="#contact" className="transition-colors hover:text-amber-700">Contact</a>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <Link to="/signin" className="text-sm font-medium transition-colors hover:text-amber-700">
              Sign In
            </Link>
            <Button className="rounded-full bg-amber-700 px-4 text-sm text-white hover:bg-amber-800 sm:px-6">
              Request a Demo
            </Button>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/signin">
              <Button variant="outline" className="rounded-full border-amber-200 px-4 text-amber-700 hover:bg-amber-50">
                Portal
              </Button>
            </Link>
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="rounded-full border border-amber-200 p-2 text-amber-700 transition-colors hover:bg-amber-50"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="mt-3 rounded-3xl border border-amber-100 bg-white p-4 shadow-lg md:hidden">
            <div className="grid grid-cols-1 gap-2 text-sm font-medium">
              <a href="#features" className="rounded-2xl px-4 py-3 transition-colors hover:bg-amber-50 hover:text-amber-700" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#about" className="rounded-2xl px-4 py-3 transition-colors hover:bg-amber-50 hover:text-amber-700" onClick={() => setMobileMenuOpen(false)}>About</a>
              <a href="#contact" className="rounded-2xl px-4 py-3 transition-colors hover:bg-amber-50 hover:text-amber-700" onClick={() => setMobileMenuOpen(false)}>Contact</a>
              <Button className="mt-2 rounded-2xl bg-amber-700 py-6 text-white hover:bg-amber-800">
                Request a Demo
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-white to-white pb-16 pt-10 sm:pt-16 md:pb-32 md:pt-24">
        <div className="container relative z-10 mx-auto px-4 sm:px-6 md:px-12">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="text-center lg:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-amber-600" />
                Streamlining Postgraduate Excellence
              </div>
              <h1 className="mb-5 text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl md:text-6xl">
                Electronic Tracking and Documentation <span className="text-amber-700">made simple</span> for every stage.
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg lg:mx-0">
                Empower students, supervisors, and administrators with one polished digital workflow for project management, approvals, defence readiness, and academic progress tracking.
              </p>
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:justify-start">
                <Button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-700 px-8 py-6 text-base text-white shadow-lg transition-all hover:bg-amber-800 sm:w-auto">
                  Request a Demo
                  <ArrowRight size={18} />
                </Button>
                <Link to="/signin" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full rounded-2xl border-amber-700 px-8 py-6 text-base text-amber-700 hover:bg-amber-50 sm:w-auto">
                    Access Portal
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-gray-500 lg:justify-start">
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">Paperless workflows</span>
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">Real-time tracking</span>
                <span className="rounded-full bg-white px-4 py-2 shadow-sm">Role-based access</span>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[28px] border border-amber-100 bg-white/90 p-4 shadow-[0_20px_60px_rgba(180,83,9,0.12)] backdrop-blur sm:p-6">
                <div className="rounded-[24px] bg-gray-900 p-5 text-white sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-200">SAKOSILE Overview</p>
                      <h3 className="mt-2 text-xl font-semibold">Everything in one mobile-friendly workspace</h3>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                      <p className="text-xs text-gray-300">Efficiency</p>
                      <p className="text-lg font-bold text-amber-300">98%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <HeroMiniCard title="Track Milestones" value="Proposal to final defence" />
                    <HeroMiniCard title="Review Status" value="Live approval visibility" />
                    <HeroMiniCard title="Manage Documents" value="Centralized digital records" />
                    <HeroMiniCard title="Support Teams" value="Students, supervisors, admins" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
      </header>

      {/* Features Section */}
      <section id="features" className="bg-white py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 md:px-12">
          <div className="mb-10 text-center sm:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Core Platform Capabilities</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              SAKOSILE provides a comprehensive suite of tools designed to handle every aspect of the postgraduate journey.
            </p>
          </div>

          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:hidden">
            <div className="w-[85%] max-w-sm shrink-0 snap-center">
              <FeatureCard 
                icon={<FileText className="text-amber-700" size={32} />}
                title="Documentation Management"
                description="Securely upload, store, and version-control all your academic documents and research work."
              />
            </div>
            <div className="w-[85%] max-w-sm shrink-0 snap-center">
              <FeatureCard 
                icon={<Clock className="text-amber-700" size={32} />}
                title="Real-time Tracking"
                description="Monitor progress milestones from proposal to final defense with automated status updates."
              />
            </div>
            <div className="w-[85%] max-w-sm shrink-0 snap-center">
              <FeatureCard 
                icon={<BarChart3 className="text-amber-700" size={32} />}
                title="Analytics Dashboard"
                description="Gain insights into student performance and departmental progress with visual data summaries."
              />
            </div>
            <div className="w-[85%] max-w-sm shrink-0 snap-center">
              <FeatureCard 
                icon={<Users className="text-amber-700" size={32} />}
                title="Collaboration Hub"
                description="Facilitate seamless communication between students, supervisors, and department heads."
              />
            </div>
            <div className="w-[85%] max-w-sm shrink-0 snap-center">
              <FeatureCard 
                icon={<ShieldCheck className="text-amber-700" size={32} />}
                title="Role-Based Access"
                description="Granular permission levels ensure that the right people have access to the right information."
              />
            </div>
            <div className="w-[85%] max-w-sm shrink-0 snap-center">
              <FeatureCard 
                icon={<CheckCircle className="text-amber-700" size={32} />}
                title="Automated Workflows"
                description="Streamline approvals, defense scheduling, and scoring with intelligent automated systems."
              />
            </div>
          </div>

          <div className="hidden grid-cols-1 gap-8 md:grid md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard 
              icon={<FileText className="text-amber-700" size={32} />}
              title="Documentation Management"
              description="Securely upload, store, and version-control all your academic documents and research work."
            />
            <FeatureCard 
              icon={<Clock className="text-amber-700" size={32} />}
              title="Real-time Tracking"
              description="Monitor progress milestones from proposal to final defense with automated status updates."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-amber-700" size={32} />}
              title="Analytics Dashboard"
              description="Gain insights into student performance and departmental progress with visual data summaries."
            />
            <FeatureCard 
              icon={<Users className="text-amber-700" size={32} />}
              title="Collaboration Hub"
              description="Facilitate seamless communication between students, supervisors, and department heads."
            />
            <FeatureCard 
              icon={<ShieldCheck className="text-amber-700" size={32} />}
              title="Role-Based Access"
              description="Granular permission levels ensure that the right people have access to the right information."
            />
            <FeatureCard 
              icon={<CheckCircle className="text-amber-700" size={32} />}
              title="Automated Workflows"
              description="Streamline approvals, defense scheduling, and scoring with intelligent automated systems."
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-amber-50/30 py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="relative order-2 lg:order-1">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/images/bg.jpg" 
                  alt="About SAKOSILE" 
                  className="h-72 w-full object-cover sm:h-96 md:h-[500px]"
                />
              </div>
              <div className="mt-4 max-w-xs rounded-2xl bg-white p-6 shadow-xl md:absolute md:-bottom-8 md:-right-8 md:mt-0 md:block md:p-8">
                <p className="text-amber-700 font-bold text-lg mb-2">Our Mission</p>
                <p className="text-gray-600 text-sm">
                  To provide a seamless, paperless, and transparent ecosystem for postgraduate academic excellence.
                </p>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <h2 className="text-amber-700 font-semibold tracking-wide uppercase text-sm mb-4">
                About the Platform
              </h2>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Bridging the Gap in Academic Documentation
              </h3>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                SAKOSILE was born out of a need to modernize the manual and often cumbersome processes 
                involved in postgraduate research tracking. We understand that academic documentation 
                is the backbone of research integrity.
              </p>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Our platform provides a centralized hub where students can manage their milestones, 
                supervisors can provide timely feedback, and administrators can maintain institutional 
                standards—all in one secure digital environment.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-amber-100 p-1 rounded-full">
                    <CheckCircle size={18} className="text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Innovation First</h4>
                    <p className="text-gray-600 text-sm">Leveraging modern technology to solve traditional academic bottlenecks.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-amber-100 p-1 rounded-full">
                    <CheckCircle size={18} className="text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Transparency</h4>
                    <p className="text-gray-600 text-sm">Clear progress tracking that keeps everyone on the same page.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-amber-100 p-1 rounded-full">
                    <CheckCircle size={18} className="text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Reliability</h4>
                    <p className="text-gray-600 text-sm">Secure storage and backup for critical research documentation.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-amber-700 py-16 text-white sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4 md:gap-8">
            <div className="rounded-3xl bg-white/10 px-4 py-5 backdrop-blur-sm">
              <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
              <div className="text-amber-100 text-sm md:text-base">Students Enrolled</div>
            </div>
            <div className="rounded-3xl bg-white/10 px-4 py-5 backdrop-blur-sm">
              <div className="text-4xl md:text-5xl font-bold mb-2">120+</div>
              <div className="text-amber-100 text-sm md:text-base">Active Supervisors</div>
            </div>
            <div className="rounded-3xl bg-white/10 px-4 py-5 backdrop-blur-sm">
              <div className="text-4xl md:text-5xl font-bold mb-2">15+</div>
              <div className="text-amber-100 text-sm md:text-base">Faculties Supported</div>
            </div>
            <div className="rounded-3xl bg-white/10 px-4 py-5 backdrop-blur-sm">
              <div className="text-4xl md:text-5xl font-bold mb-2">98%</div>
              <div className="text-amber-100 text-sm md:text-base">Efficiency Increase</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 md:px-12">
          <div className="relative z-10 overflow-hidden rounded-3xl bg-gray-900 p-6 text-center text-white sm:p-8 md:p-16">
            <div className="mx-auto mb-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
              Get Started
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your academic documentation?</h2>
            <p className="mx-auto mb-10 max-w-2xl text-base text-gray-400 sm:text-lg">
              Join the institutions already using SAKOSILE to digitize and track their postgraduate processes.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button className="w-full rounded-2xl bg-amber-700 px-8 py-5 text-base text-white shadow-lg hover:bg-amber-800 sm:w-auto sm:px-10 sm:text-lg">
                Request a Demo Today
              </Button>
              <Link to="/signin" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full rounded-2xl border-white/20 bg-white/5 px-8 py-5 text-base text-white hover:bg-white/10 sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
            
            {/* Decorative background for CTA */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-amber-700/20 rounded-full blur-3xl" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t bg-gray-50 pb-10 pt-16 sm:pt-20">
        <div className="container mx-auto px-4 sm:px-6 md:px-12">
          <div className="mb-12 grid grid-cols-1 gap-10 text-center md:mb-16 md:grid-cols-4 md:gap-12 md:text-left">
            <div className="col-span-1 md:col-span-2">
              <h1 className="text-2xl font-bold text-amber-700 mb-6">SAKOSILE</h1>
              <p className="mx-auto mb-6 max-w-sm text-gray-600 md:mx-0">
                Electronic Tracking and Documentation System for Postgraduate Students
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6">Platform</h4>
              <ul className="space-y-4 text-gray-600 text-sm">
                <li><a href="#features" className="hover:text-amber-700">Features</a></li>
                <li><a href="#" className="hover:text-amber-700">Documentation</a></li>
                <li><a href="#" className="hover:text-amber-700">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Support</h4>
              <ul className="space-y-4 text-gray-600 text-sm">
                <li><a href="#" className="hover:text-amber-700">Help Center</a></li>
                <li><a href="#" className="hover:text-amber-700">Contact Us</a></li>
                <li><a href="#" className="hover:text-amber-700">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-10 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} SAKOSILE. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="group rounded-2xl border p-6 transition-all duration-300 hover:border-amber-700/50 hover:bg-amber-50/30 sm:p-8">
    <div className="mb-6 p-3 bg-amber-50 rounded-xl w-fit group-hover:bg-amber-100 transition-colors">
      {icon}
    </div>
    <h3 className="mb-3 text-lg font-bold text-gray-900 sm:text-xl">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

interface HeroMiniCardProps {
  title: string;
  value: string;
}

const HeroMiniCard = ({ title, value }: HeroMiniCardProps) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{title}</p>
    <p className="mt-2 text-sm font-medium leading-6 text-white">{value}</p>
  </div>
);

export default LandingPage;
