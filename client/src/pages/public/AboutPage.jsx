import { Heart, Users, Award, Target } from "lucide-react";

const values = [
  { icon: Heart, title: "Patient First", desc: "Every decision we make starts with the patient's well-being." },
  { icon: Users, title: "Inclusivity", desc: "Healthcare accessible to everyone, regardless of background." },
  { icon: Award, title: "Excellence", desc: "Partnering only with verified, top-rated medical professionals." },
  { icon: Target, title: "Innovation", desc: "Leveraging technology to simplify healthcare delivery." },
];

const team = [
  { name: "Dr. Ananya Sharma", role: "Founder & CEO", bio: "Former Chief of Medicine at City Hospital with 20+ years in healthcare innovation." },
  { name: "Rahul Mehta", role: "CTO", bio: "Ex-Google engineer passionate about building technology for social impact." },
  { name: "Dr. Priya Nair", role: "Medical Director", bio: "Board-certified internist focused on patient-centric care models." },
];

const AboutPage = () => (
  <div className="section-padding">
    <div className="section-container">
      {/* Hero */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-5xl">
          Making Healthcare <span className="text-gradient">Accessible to All</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Medicare was founded with a simple mission: remove the barriers between people and quality healthcare.
          We connect patients with trusted doctors, modern diagnostics, and digital health tools.
        </p>
      </div>

      {/* Values */}
      <div className="mt-20">
        <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Our Values</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="card-healthcare text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary">
                <v.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="mt-20">
        <h2 className="mb-8 text-center text-2xl font-bold text-foreground">Leadership Team</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {team.map((m) => (
            <div key={m.name} className="card-healthcare text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent text-primary">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-foreground">{m.name}</h3>
              <p className="text-sm font-medium text-primary">{m.role}</p>
              <p className="mt-2 text-sm text-muted-foreground">{m.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default AboutPage;
