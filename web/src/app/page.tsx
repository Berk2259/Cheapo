import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Categories } from "@/components/landing/categories";
import { Plans } from "@/components/landing/plans";
import { Faq } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-canvas text-ink">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-36 h-[480px] w-[480px] rounded-full bg-blob-1 opacity-45 blur-[90px]" />
        <div className="absolute -right-32 top-32 h-[420px] w-[420px] rounded-full bg-blob-2 opacity-45 blur-[90px]" />
        <div className="absolute -bottom-32 left-[30%] h-[380px] w-[380px] rounded-full bg-blob-3 opacity-45 blur-[90px]" />
      </div>

      <Hero />

      <div className="mx-auto max-w-[1100px] px-[22px]">
        <HowItWorks />
        <Categories />
        <Faq />
        <Plans />
      </div>

      <Footer />
    </div>
  );
}