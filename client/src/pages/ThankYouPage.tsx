import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ThankYouPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search || "" : ""
  );
  const sessionId = params.get("session_id") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["/api/verify-purchase", sessionId],
    queryFn: async () => {
      if (!sessionId) return { valid: false, email: "", name: "" };
      const res = await apiRequest("GET", `/api/verify-purchase?session_id=${sessionId}`);
      return res.json() as Promise<{ valid: boolean; email: string; name: string }>;
    },
    enabled: !!sessionId,
    retry: 3,
    retryDelay: 1500,
  });

  const firstName = data?.name ? data.name.split(" ")[0] : "Legend";
  const email = data?.email || "";
  const downloadUrl = sessionId ? `/api/download/${sessionId}` : "#";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#7A7470] text-sm">Confirming your purchase…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      {/* Gold top bar */}
      <div className="h-1 bg-amber-500 w-full" />

      <div className="max-w-2xl mx-auto px-6 py-20">
        {data?.valid !== false ? (
          <>
            {/* Success Header */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-black text-2xl font-black">✓</span>
              </div>
              <p className="section-label mb-3">Payment Confirmed</p>
              <h1 className="text-4xl font-black text-white mb-4">
                {firstName}, You're In.
              </h1>
              <p className="text-[#C8B898] text-lg leading-relaxed max-w-md mx-auto">
                Your copy of The Mog Effect Blueprint is ready.
                {email && (
                  <> A delivery email is on its way to <strong className="text-white">{email}</strong>.</>
                )}
              </p>
            </div>

            {/* Download box */}
            <div className="bg-[#1A1814] border-2 border-amber-500 p-8 rounded-sm text-center mb-10">
              <p className="section-label mb-3">Step 1 of 2</p>
              <h2 className="text-2xl font-black text-white mb-3">Download Your Blueprint</h2>
              <p className="text-[#B8B0A8] text-sm mb-6">
                Click below to download your PDF. Save it to your phone, tablet, and laptop.
              </p>
              <a
                href={downloadUrl}
                download="The_Mog_Effect_Blueprint.pdf"
                data-testid="link-download"
                className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-4 px-10 rounded-sm uppercase tracking-wide text-base transition-all"
              >
                → Download The Blueprint Now
              </a>
              <p className="text-xs text-[#5A5450] mt-4">
                PDF · 15 pages · Instant download
              </p>
            </div>

            {/* What to do first */}
            <div className="bg-[#1A1814] border border-[#2D2926] p-7 mb-10">
              <p className="section-label mb-3">Step 2 of 2 — Start This Week</p>
              <h2 className="text-xl font-black text-white mb-5">Your First 72 Hours</h2>
              <div className="space-y-4">
                {[
                  { day: "Today", action: "Read Sections 01–05. Understand the framework and set your protein target." },
                  { day: "Tomorrow", action: "Plan your first 3 meals around protein. Shop or order accordingly." },
                  { day: "Day 3", action: "Complete Day 1 of the training split. Don't modify it — just execute it." },
                ].map((step) => (
                  <div key={step.day} className="flex gap-4 items-start">
                    <span className="bg-amber-500 text-black text-xs font-black px-2.5 py-1 shrink-0 rounded-sm">{step.day}</span>
                    <span className="text-[#C8B898] text-[14px] leading-relaxed">{step.action}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coaching CTA */}
            <div className="bg-[#1A1814] border-l-2 border-amber-500 p-7 mb-10">
              <p className="section-label mb-2">Want to Go Faster?</p>
              <h2 className="text-xl font-black text-white mb-3">1-on-1 Coaching with Bryan</h2>
              <p className="text-[#B8B0A8] text-[14px] leading-relaxed mb-5">
                The blueprint gives you the system. Coaching gives you a custom plan, real accountability,
                and a coach who knows exactly where you'll get stuck before you do.
                Bryan works with a small, intentional roster of men — sales professionals, executives, and dads.
              </p>
              <div className="space-y-2 mb-6">
                {[
                  "Custom programming around your actual schedule",
                  "Weekly 1-on-1 check-ins with Bryan directly",
                  "Real-time adjustments for travel and work demands",
                  "Access to Bryan's private client community",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <span className="text-amber-500 text-xs shrink-0">✓</span>
                    <span className="text-[#C8B898] text-[13px]">{item}</span>
                  </div>
                ))}
              </div>
              <a
                href="https://bryanmogrovejo.com/coaching"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-coaching"
                className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3.5 px-8 rounded-sm uppercase tracking-wide text-sm transition-all"
              >
                Apply for 1-on-1 Coaching →
              </a>
            </div>

            {/* Support */}
            <div className="text-center border-t border-[#2D2926] pt-8">
              <p className="text-[#7A7470] text-sm">
                Questions about your purchase?{" "}
                <a href="mailto:bryan@bryanmogrovejo.com" className="text-amber-600 hover:text-amber-500">
                  bryan@bryanmogrovejo.com
                </a>
              </p>
            </div>
          </>
        ) : (
          /* Invalid/expired session */
          <div className="text-center py-20">
            <h1 className="text-3xl font-black text-white mb-4">Purchase Not Found</h1>
            <p className="text-[#C8B898] mb-8">
              If you completed a purchase, check your email for the delivery link.
              If you need help, email{" "}
              <a href="mailto:bryan@bryanmogrovejo.com" className="text-amber-500">
                bryan@bryanmogrovejo.com
              </a>
            </p>
            <a href="/#/" className="text-amber-500 hover:text-amber-400 font-bold">
              ← Back to the sales page
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
