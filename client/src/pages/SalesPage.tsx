import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// ── Social proof data ──────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Marcus T.",
    role: "Sales Director, Dallas TX",
    text: "I've bought a dozen fitness programs. None of them accounted for the fact that I'm on the road 3 weeks a month. The Mog Effect was the first plan I actually finished.",
    result: "Lost 18lbs in 10 weeks",
  },
  {
    name: "Derek L.",
    role: "Father of 3, Chicago IL",
    text: "The weekend control system alone was worth the price. I was destroying my progress every Friday. That section flipped a switch.",
    result: "Down 3 inches off waist",
  },
  {
    name: "Chris V.",
    role: "Regional VP, Finance",
    text: "No gym bro nonsense. No unrealistic meal prep. Just a clear, direct plan that respects that I have a real job and a family.",
    result: "50lbs stronger on deadlift",
  },
];

const WHATS_INSIDE = [
  { num: "01", title: "Body Recomposition Framework", desc: "The 4-lever system behind every protocol in the blueprint" },
  { num: "02", title: "3-Day Training Split", desc: "Complete program with sets, reps, and execution cues" },
  { num: "03", title: "Protein-First Nutrition", desc: "Plate formula + sample meals that work anywhere" },
  { num: "04", title: "Travel Protocol", desc: "Hotel gym workout + airport / client dinner rules" },
  { num: "05", title: "Weekend Control System", desc: "5 decision points that stop weekend self-sabotage" },
  { num: "06", title: "12-Week Execution Plan", desc: "Phased progression — consistency first, optimization second" },
  { num: "07", title: "Progress Tracking System", desc: "5 metrics that actually predict results" },
  { num: "08", title: "Plateau Diagnostics", desc: "Exact questions to ask before changing anything" },
  { num: "09", title: "The 9 Mistakes", desc: "What's actually killing your results (and how to stop)" },
];

const OBJECTIONS = [
  {
    q: "I've tried fitness programs before and they never stick.",
    a: "Every other plan was built for someone with fewer demands. This one expects travel, client dinners, kids' games, and brutal weeks. Consistency survives because the plan expects your life.",
  },
  {
    q: "I don't have time to track macros or meal prep.",
    a: "No tracking required. The Mog Effect uses a protein-first structure and simple plate formula. You can execute it at Chipotle, a hotel, or a client dinner.",
  },
  {
    q: "Is $27 really going to change anything?",
    a: "Information alone doesn't change anything. A clear system you actually follow does. This is 15 pages — no filler, no upsells inside the PDF, just the framework.",
  },
  {
    q: "I travel too much to follow a gym program.",
    a: "There's an entire section built for travel with a 30-minute hotel gym workout, airport rules, and a dinner protocol. The plan assumes you'll be on the road.",
  },
];

// ── Checkout mutation ──────────────────────────────────────────────────────
function useCheckout() {
  return useMutation({
    mutationFn: async ({ email, name }: { email: string; name: string }) => {
      const res = await apiRequest("POST", "/api/checkout", { email, name });
      const data = await res.json();
      return data as { url?: string; sessionId?: string; error?: string };
    },
  });
}

// ── CheckoutForm component ─────────────────────────────────────────────────
function CheckoutForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const checkout = useCheckout();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await checkout.mutateAsync({ email, name });
    if (result.url) {
      window.location.href = result.url;
    } else if (result.error) {
      alert("Error: " + result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="checkout-form">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-amber-400 mb-1.5">
          First Name
        </label>
        <input
          type="text"
          placeholder="Bryan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          data-testid="input-name"
          className="w-full bg-[#111008] border border-[#3D3530] rounded-sm px-4 py-3 text-white placeholder-[#5A5450] focus:outline-none focus:border-amber-500 text-[15px]"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest text-amber-400 mb-1.5">
          Email Address
        </label>
        <input
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="input-email"
          className="w-full bg-[#111008] border border-[#3D3530] rounded-sm px-4 py-3 text-white placeholder-[#5A5450] focus:outline-none focus:border-amber-500 text-[15px]"
        />
      </div>
      <button
        type="submit"
        disabled={checkout.isPending}
        data-testid="button-checkout"
        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-4 px-6 rounded-sm text-[16px] uppercase tracking-wide transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {checkout.isPending ? "Redirecting to checkout…" : "Get Instant Access — $27"}
      </button>
      <p className="text-center text-xs text-[#7A7470] pt-1">
        Secure checkout via Stripe · Instant PDF delivery · No subscription
      </p>
      <div className="flex items-center justify-center gap-3 pt-1 opacity-60">
        {["Visa", "Mastercard", "Amex", "Apple Pay"].map((cc) => (
          <span key={cc} className="text-xs border border-[#3D3530] rounded px-2 py-0.5 text-[#7A7470]">{cc}</span>
        ))}
      </div>
    </form>
  );
}

// ── Main SalesPage ─────────────────────────────────────────────────────────
export default function SalesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollToCheckout = () => {
    document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Work Sans', sans-serif" }}>

      {/* ── TOP BAR ── */}
      <div className="bg-amber-500 text-black text-center py-2 px-4 text-xs font-bold uppercase tracking-widest">
        Limited Intro Pricing — $27 (Regular $97) · Instant Download
      </div>

      {/* ── HERO ── */}
      <section className="relative bg-[#0A0A0A] pt-16 pb-20 px-6">
        {/* Gold left rule */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500 opacity-40" />

        <div className="max-w-3xl mx-auto text-center">
          <p className="section-label mb-4">The Mog Effect Blueprint</p>
          <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
            The Body<br />
            <span className="text-amber-500">You Actually Want</span><br />
            Without Giving Up<br />Your Life
          </h1>
          <div className="gold-rule-sm mx-auto mb-6" />
          <p className="text-xl text-[#C8B898] max-w-xl mx-auto mb-4 leading-relaxed">
            A 15-page recomposition system for busy dads, sales professionals, and high-performing men
            who want to get lean without fitness taking over their life.
          </p>
          <p className="text-[#7A7470] text-base mb-10">
            Built by Bryan Mogrovejo — fitness coach to executives, sales reps, and dads who refuse to settle.
          </p>

          <button
            onClick={scrollToCheckout}
            data-testid="button-hero-cta"
            className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-4 px-10 rounded-sm text-base uppercase tracking-wide transition-all duration-150 mb-4 inline-block"
          >
            Get the Blueprint — $27
          </button>
          <p className="text-xs text-[#5A5450]">PDF delivered instantly to your inbox after checkout</p>

          {/* Social proof numbers */}
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mt-14 border-t border-[#2D2926] pt-10">
            {[["15", "Pages of pure system"], ["12", "Week execution plan"], ["$27", "One-time, instant access"]].map(([val, lbl]) => (
              <div key={val} className="text-center">
                <div className="text-2xl font-black text-amber-500">{val}</div>
                <div className="text-xs text-[#7A7470] mt-0.5">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section className="bg-[#111008] py-16 px-6 border-t border-[#2D2926]">
        <div className="max-w-2xl mx-auto">
          <p className="section-label mb-3">The Real Problem</p>
          <h2 className="text-3xl font-black text-white mb-6">You're Not Failing Because You're Lazy.</h2>
          <p className="text-[#C8B898] text-lg leading-relaxed mb-6">
            You're failing because the plans you've tried were built for someone with fewer demands, lower stress, and more available time.
          </p>
          <div className="space-y-3">
            {[
              "Skipping meals all day, then overeating at night",
              "Training hard for 2 days, then disappearing for 5",
              "Being disciplined Monday–Thursday, reckless on weekends",
              "Using travel and client dinners as weekly reset triggers",
              "Restarting 'Monday' every single week for years",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="text-red-500 mt-0.5 font-bold shrink-0">✗</span>
                <span className="text-[#B8B0A8]">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 border-l-2 border-amber-500 pl-5 py-2">
            <p className="text-amber-400 font-bold text-lg">
              "Most men don't need more discipline. They need a system that doesn't require it."
            </p>
          </div>
        </div>
      </section>

      {/* ── WHAT'S INSIDE ── */}
      <section className="bg-[#0A0A0A] py-16 px-6 border-t border-[#2D2926]">
        <div className="max-w-2xl mx-auto">
          <p className="section-label mb-3">What's Inside</p>
          <h2 className="text-3xl font-black text-white mb-2">15 Pages. Zero Filler.</h2>
          <p className="text-[#7A7470] mb-10">Every section is a protocol you can execute this week.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {WHATS_INSIDE.map((item) => (
              <div key={item.num} className="bg-[#1A1814] border border-[#2D2926] p-4 flex gap-4 items-start hover:border-amber-600/50 transition-colors">
                <span className="text-amber-500 font-black text-sm shrink-0 mt-0.5">{item.num}</span>
                <div>
                  <div className="text-white font-semibold text-sm mb-0.5">{item.title}</div>
                  <div className="text-[#7A7470] text-xs leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="bg-[#111008] py-16 px-6 border-t border-[#2D2926]">
        <div className="max-w-2xl mx-auto">
          <p className="section-label mb-3">This Is For You If…</p>
          <h2 className="text-3xl font-black text-white mb-8">Sound Familiar?</h2>
          <div className="space-y-3 mb-10">
            {[
              "You're 30–55 and want to look the way you carry yourself in every other part of life",
              "You travel frequently and every plan breaks down the moment you leave home",
              "You have a demanding job, a family, and 3–5 hours a week for fitness — max",
              "You've done the restart loop for years and are done with it",
              "You want a strong, lean body — not a bodybuilder physique — just the version of yourself that looks sharp",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 bg-[#0A0A0A] border border-[#2D2926] p-4 rounded-sm">
                <span className="text-amber-500 font-bold shrink-0">✓</span>
                <span className="text-[#C8B898] text-[15px]">{item}</span>
              </div>
            ))}
          </div>
          <button
            onClick={scrollToCheckout}
            data-testid="button-mid-cta"
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-4 rounded-sm uppercase tracking-wide text-base transition-all"
          >
            I'm In — Get the Blueprint for $27
          </button>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-[#0A0A0A] py-16 px-6 border-t border-[#2D2926]">
        <div className="max-w-2xl mx-auto">
          <p className="section-label mb-3">Real Results</p>
          <h2 className="text-3xl font-black text-white mb-10">Men Who Applied The System</h2>
          <div className="space-y-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-[#1A1814] border-l-2 border-amber-500 p-6">
                <p className="text-[#C8B898] text-[15px] leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold text-sm">{t.name}</div>
                    <div className="text-[#7A7470] text-xs">{t.role}</div>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-sm">
                    <span className="text-amber-400 text-xs font-bold">{t.result}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT BRYAN ── */}
      <section className="bg-[#111008] py-16 px-6 border-t border-[#2D2926]">
        <div className="max-w-2xl mx-auto">
          <p className="section-label mb-3">The Coach</p>
          <h2 className="text-3xl font-black text-white mb-6">Bryan Mogrovejo</h2>
          <div className="border-l-2 border-amber-500 pl-5 mb-6">
            <p className="text-amber-400 font-bold">Fitness coach to busy men. Creator of The Mog Effect.</p>
          </div>
          <p className="text-[#C8B898] text-[15px] leading-relaxed mb-4">
            Bryan built The Mog Effect because he was the man who needed it — a high-performer with real demands,
            real travel, and no patience for fitness programs designed for people with unlimited time.
          </p>
          <p className="text-[#C8B898] text-[15px] leading-relaxed mb-4">
            He works 1-on-1 with a small group of executives, sales professionals, and dads who are serious
            about transforming their body without giving up their career or family.
          </p>
          <p className="text-[#7A7470] text-sm">
            bryanmogrovejo.com · @TheMogEffect
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#0A0A0A] py-16 px-6 border-t border-[#2D2926]">
        <div className="max-w-2xl mx-auto">
          <p className="section-label mb-3">Common Questions</p>
          <h2 className="text-3xl font-black text-white mb-10">Objections Answered</h2>
          <div className="space-y-2">
            {OBJECTIONS.map((faq, i) => (
              <div key={i} className="bg-[#1A1814] border border-[#2D2926]">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  data-testid={`button-faq-${i}`}
                  className="w-full text-left px-5 py-4 flex items-center justify-between"
                >
                  <span className="text-white font-semibold text-[15px] pr-4">{faq.q}</span>
                  <span className="text-amber-500 text-lg shrink-0">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-[#B8B0A8] text-[14px] leading-relaxed border-t border-[#2D2926] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHECKOUT SECTION ── */}
      <section id="checkout" className="bg-[#111008] py-20 px-6 border-t-2 border-amber-500">
        <div className="max-w-md mx-auto">
          <p className="section-label text-center mb-3">Get Instant Access</p>
          <h2 className="text-4xl font-black text-white text-center mb-2">
            The Mog Effect Blueprint
          </h2>
          <p className="text-[#C8B898] text-center mb-2 text-base">
            15-Page Body Recomposition System for Busy Men
          </p>
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="text-[#7A7470] line-through text-lg">$97</span>
            <span className="text-amber-500 font-black text-4xl">$27</span>
          </div>

          {/* What they get */}
          <div className="bg-[#0A0A0A] border border-[#2D2926] p-5 mb-6 rounded-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-3">What You Get</p>
            {[
              "15-page enhanced blueprint PDF",
              "3-day training split with full exercise guide",
              "Protein-first nutrition system + sample day",
              "Travel & hotel gym protocols",
              "12-week phased execution plan",
              "Weekend control system",
              "Progress tracking + plateau diagnostics",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 py-1.5 border-b border-[#1A1814] last:border-0">
                <span className="text-amber-500 text-xs shrink-0">✓</span>
                <span className="text-[#C8B898] text-[13px]">{item}</span>
              </div>
            ))}
          </div>

          <CheckoutForm />

          <p className="text-center text-xs text-[#5A5450] mt-4">
            Questions? Email{" "}
            <a href="mailto:bryan@bryanmogrovejo.com" className="text-amber-600 hover:text-amber-500">
              bryan@bryanmogrovejo.com
            </a>
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0A0A0A] border-t border-[#2D2926] py-8 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-amber-500 font-black text-lg mb-2">THE MOG EFFECT</div>
          <p className="text-xs text-[#4A4540]">
            © 2026 Bryan Mogrovejo Coaching · All Rights Reserved<br />
            <a href="mailto:bryan@bryanmogrovejo.com" className="hover:text-amber-600">bryan@bryanmogrovejo.com</a>
            {" · "}
            <a href="https://bryanmogrovejo.com" className="hover:text-amber-600">bryanmogrovejo.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
