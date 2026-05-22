import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  CheckCircle, 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  Users, 
  Clock 
} from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-amber-700 tracking-tight">SAKOSILE</h1>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#features" className="hover:text-amber-700 transition-colors">Features</a>
          <a href="#about" className="hover:text-amber-700 transition-colors">About</a>
          <a href="#contact" className="hover:text-amber-700 transition-colors">Contact</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/signin" className="text-sm font-medium hover:text-amber-700 transition-colors">
            Sign In
          </Link>
          <Button className="bg-amber-700 hover:bg-amber-800 text-white rounded-full px-6">
            Request a Demo
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-amber-50/50 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-amber-700 font-semibold tracking-wide uppercase text-sm mb-4">
              Streamlining Postgraduate Excellence
            </h2>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Electronic Tracking and Documentation <span className="text-amber-700">Simplified.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Empowering students, supervisors, and administrators with a unified platform 
              for seamless project management, documentation, and progress tracking.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="w-full sm:w-auto bg-amber-700 hover:bg-amber-800 text-white text-lg py-6 px-10 rounded-full flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg">
                Request a Demo
                <ArrowRight size={20} />
              </Button>
              <Link to="/signin" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto border-amber-700 text-amber-700 hover:bg-amber-50 text-lg py-6 px-10 rounded-full">
                  Access Portal
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl" />
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Core Platform Capabilities</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              SAKOSILE provides a comprehensive suite of tools designed to handle every aspect of the postgraduate journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
      <section id="about" className="py-24 bg-amber-50/30">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/images/bg.jpg" 
                  alt="About SAKOSILE" 
                  className="w-full h-[500px] object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 bg-white p-8 rounded-2xl shadow-xl hidden md:block max-w-xs">
                <p className="text-amber-700 font-bold text-lg mb-2">Our Mission</p>
                <p className="text-gray-600 text-sm">
                  To provide a seamless, paperless, and transparent ecosystem for postgraduate academic excellence.
                </p>
              </div>
            </div>
            
            <div>
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
      <section className="py-20 bg-amber-700 text-white">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
              <div className="text-amber-100 text-sm md:text-base">Students Enrolled</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">120+</div>
              <div className="text-amber-100 text-sm md:text-base">Active Supervisors</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">15+</div>
              <div className="text-amber-100 text-sm md:text-base">Faculties Supported</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">98%</div>
              <div className="text-amber-100 text-sm md:text-base">Efficiency Increase</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white overflow-hidden relative">
        <div className="container mx-auto px-6 md:px-12">
          <div className="bg-gray-900 rounded-3xl p-8 md:p-16 text-center text-white relative z-10 overflow-hidden">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to transform your academic documentation?</h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              Join the institutions already using SAKOSILE to digitize and track their postgraduate processes.
            </p>
            <Button className="bg-amber-700 hover:bg-amber-800 text-white text-lg py-6 px-10 rounded-full transition-all shadow-lg">
              Request a Demo Today
            </Button>
            
            {/* Decorative background for CTA */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-amber-700/20 rounded-full blur-3xl" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-50 pt-20 pb-10 border-t">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <h1 className="text-2xl font-bold text-amber-700 mb-6">SAKOSILE</h1>
              <p className="text-gray-600 max-w-sm mb-6">
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
  <div className="p-8 border rounded-2xl hover:border-amber-700/50 hover:bg-amber-50/30 transition-all duration-300 group">
    <div className="mb-6 p-3 bg-amber-50 rounded-xl w-fit group-hover:bg-amber-100 transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

export default LandingPage;
