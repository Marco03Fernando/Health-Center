import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { fetchDoctors, fetchLabTests } from "@/services/public.service";
import {
  Stethoscope,
  FlaskConical,
  FileText,
  FolderHeart,
  ShoppingBag,
  Star,
  ArrowRight,
  Users,
  Activity,
  Shield,
  Clock,
  Phone,
  ChevronRight,
  MapPin,
  Loader2,
  Tag,
} from "lucide-react";

/* static data */
const services = [
  { icon: Stethoscope, title: "Consultation", desc: "Connect with top doctors online or in-person" },
  { icon: FlaskConical, title: "Lab Tests", desc: "Book tests and get reports delivered digitally" },
  { icon: FileText, title: "Prescriptions", desc: "Digital prescriptions from verified doctors" },
  { icon: FolderHeart, title: "Health Records", desc: "Secure cloud storage for all your records" },
  { icon: ShoppingBag, title: "Marketplace", desc: "Order medicines and wellness products" },
];

const whyUs = [
  { icon: Shield, title: "Trusted Doctors", desc: "All doctors verified with 10+ years avg. experience" },
  { icon: Clock, title: "Easy Booking", desc: "Book appointments in under 60 seconds" },
  { icon: FolderHeart, title: "Secure Records", desc: "End-to-end encrypted health data" },
  { icon: Activity, title: "Fast Service", desc: "Same-day appointments and lab results" },
  { icon: ShoppingBag, title: "Marketplace", desc: "Order medicines and wellness products from your home" },
];

const steps = [
  { step: "01", title: "Search", desc: "Find doctors or tests by specialization" },
  { step: "02", title: "Select", desc: "Compare profiles, reviews & fees" },
  { step: "03", title: "Book", desc: "Choose a slot and confirm instantly" },
  { step: "04", title: "Get Care", desc: "Visit or consult online-get reports digitally" },
];

const testimonials = [
  { name: "Priya M.", text: "Booking was seamless, and the doctor was excellent. I got my lab results the same day!", rating: 5 },
  { name: "David L.", text: "Finally a platform that makes healthcare feel modern and hassle-free.", rating: 5 },
  { name: "Anita R.", text: "Loved the digital prescriptions and health record features. Highly recommend!", rating: 5 },
];

const stats = [
  { value: "500+", label: "Verified Doctors" },
  { value: "50K+", label: "Happy Patients" },
  { value: "200+", label: "Lab Tests" },
  { value: "98%", label: "Satisfaction" },
];

const DAYS_SHORT = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

function useAuthNavigate() {
  const navigate = useNavigate();
  return (path) => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate(path);
    } else {
      navigate(`/user/auth?redirect=${encodeURIComponent(path)}`);
    }
  };
}

const HomePage = () => {
  const goProtected = useAuthNavigate();

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  useEffect(() => {
    fetchDoctors({ limit: 4 })
      .then((d) => setDoctors(d.items ?? []))
      .catch(() => setDoctors([]))
      .finally(() => setDoctorsLoading(false));
  }, []);

  const [labTests, setLabTests] = useState([]);
  const [labLoading, setLabLoading] = useState(true);
  useEffect(() => {
    fetchLabTests()
      .then((d) => setLabTests((d.data ?? []).slice(0, 6)))
      .catch(() => setLabTests([]))
      .finally(() => setLabLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero section-padding">
        <div className="section-container flex flex-col items-center text-center">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Activity className="h-3.5 w-3.5" /> Trusted by 50,000+ patients
          </span>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
            Healthcare Made{" "}
            <span className="text-gradient">Simple & Accessible</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Book doctor consultations, lab tests, and manage your health records — all in one trusted platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button variant="hero" size="xl" onClick={() => goProtected("/user/consult")}>
              <Stethoscope className="h-5 w-5" /> Book Consultation
            </Button>
            <Button variant="hero-outline" size="xl" onClick={() => goProtected("/user/lab-bookings/new")}>
              <FlaskConical className="h-5 w-5" /> Book Lab Test
            </Button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="section-padding">
        <div className="section-container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">Our Services</h2>
            <p className="mt-3 text-muted-foreground">Everything you need for your health, in one place</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {services.map((s) => (
              <div key={s.title} className="card-healthcare group flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Doctors - live BE data */}
      <section className="bg-muted section-padding">
        <div className="section-container">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">Featured Doctors</h2>
              <p className="mt-2 text-muted-foreground">Top-rated specialists ready to help</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link to="/doctors">View All <ChevronRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          {doctorsLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : doctors.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No doctors available right now.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {doctors.map((d) => (
                <div key={d._id} className="card-healthcare flex flex-col">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
                    <Stethoscope className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-foreground">{d.name}</h3>
                  <p className="text-sm font-medium text-primary">{d.specialization}</p>
                  {d.centerId?.name && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" /> {d.centerId.name}
                    </p>
                  )}
                  {d.workingDays?.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {d.workingDays.map((x) => DAYS_SHORT[x] ?? x).join(", ")}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="text-lg font-bold text-foreground">
                      {d.fee != null ? `LKR ${d.fee}` : ""}
                    </span>
                    <Button size="sm" onClick={() => goProtected("/user/consult")}>Book Now</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 text-center sm:hidden">
            <Button variant="outline" asChild><Link to="/doctors">View All Doctors</Link></Button>
          </div>
        </div>
      </section>

      {/* Popular Lab Tests - live BE data */}
      <section className="section-padding">
        <div className="section-container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">Popular Lab Tests</h2>
            <p className="mt-3 text-muted-foreground">Quick, affordable, and accurate diagnostics</p>
          </div>
          {labLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : labTests.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">No lab tests available right now.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {labTests.map((t) => (
                <div key={t._id} className="card-healthcare flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                      <FlaskConical className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{t.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {t.category ? (
                          <span className="inline-flex items-center gap-1"><Tag className="h-3 w-3" />{t.category}</span>
                        ) : t.description}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    {t.price != null && <p className="font-bold text-foreground">LKR {t.price}</p>}
                    <button
                      onClick={() => goProtected("/user/lab-bookings")}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Book <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <Button variant="outline" asChild><Link to="/lab-tests">View All Tests</Link></Button>
          </div>
        </div>
      </section>

      {/* Why Choose Medicare */}
      <section className="bg-muted section-padding">
        <div className="section-container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">Why Choose Medicare</h2>
            <p className="mt-3 text-muted-foreground">We are committed to making healthcare better for everyone</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {whyUs.map((w) => (
              <div key={w.title} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary">
                  <w.icon className="h-7 w-7" />
                </div>
                <h3 className="font-bold text-foreground">{w.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding">
        <div className="section-container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">How It Works</h2>
            <p className="mt-3 text-muted-foreground">Get care in 4 simple steps</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="card-healthcare text-center">
                <span className="text-gradient text-3xl font-extrabold">{s.step}</span>
                <h3 className="mt-2 font-bold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials + Stats */}
      <section className="bg-muted section-padding">
        <div className="section-container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">What Patients Say</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="card-healthcare">
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
                <p className="mt-4 text-sm font-bold text-foreground">{t.name}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-gradient text-4xl font-extrabold">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="section-container">
          <div className="gradient-cta overflow-hidden rounded-3xl px-8 py-16 text-center text-primary-foreground">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to Take Control of Your Health?</h2>
            <p className="mx-auto mt-4 max-w-lg opacity-90">
              Join thousands of patients who trust Medicare for their healthcare needs.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button
                variant="hero-outline"
                size="xl"
                className="border-primary-foreground bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => goProtected("/user/consult")}
              >
                <Phone className="h-5 w-5" /> Book a Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
