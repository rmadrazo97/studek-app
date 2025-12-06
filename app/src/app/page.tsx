import {
  Navigation,
  Hero,
  SocialProof,
  PainSolution,
  Features,
  Comparison,
  Pricing,
  FAQ,
  Footer,
  StickyCTA,
} from "@/components/landing";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#08090a]">
      <Navigation />
      <Hero />
      <SocialProof />
      <PainSolution />
      <Features />
      <Comparison />
      <Pricing />
      <FAQ />
      <Footer />
      <StickyCTA />
    </main>
  );
}
