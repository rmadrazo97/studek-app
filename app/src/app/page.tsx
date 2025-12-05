import {
  Navigation,
  Hero,
  PainSolution,
  Features,
  Comparison,
  Pricing,
  FAQ,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#08090a]">
      <Navigation />
      <Hero />
      <PainSolution />
      <Features />
      <Comparison />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
