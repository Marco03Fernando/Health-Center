import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

const contactInfo = [
  { icon: Phone, label: "Phone", value: "+94 11 234 5678" },
  { icon: Mail, label: "Email", value: "hello@careconnect.lk" },
  { icon: MapPin, label: "Address", value: "123 Health Street, Colombo, Sri Lanka" },
  { icon: Clock, label: "Hours", value: "Mon–Sat: 8 AM – 8 PM" },
];

const ContactPage = () => (
  <div className="section-padding">
    <div className="section-container">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">Get in Touch</h1>
        <p className="mt-3 text-muted-foreground">
          Have questions or need help? Reach out to us — we're here for you.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-5">
        {/* Contact Info */}
        <div className="space-y-6 lg:col-span-2">
          {contactInfo.map((c) => (
            <div key={c.label} className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{c.label}</p>
                <p className="text-sm text-muted-foreground">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="card-healthcare lg:col-span-3">
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                <input
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <input
                  type="email"
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="john@example.com"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Subject</label>
              <input
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="How can we help?"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Message</label>
              <textarea
                rows={5}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="Write your message..."
              />
            </div>
            <Button size="lg" className="w-full sm:w-auto">Send Message</Button>
          </form>
        </div>
      </div>
    </div>
  </div>
);

export default ContactPage;
