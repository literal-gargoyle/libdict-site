import { Navigation } from "@/components/layout/navigation";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero-section";
import { FeatureHighlights } from "@/components/sections/feature-highlights";
import { CTASection } from "@/components/sections/cta-section";
import { Helmet } from "react-helmet";

export default function Home() {
  return (
    <>
      <Helmet>
        <title>LibDict - A Flashcard System for Efficient Studying</title>
        <meta name="description" content="A minimal yet powerful library-based flashcard system for efficient studying" />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-grow">
          <HeroSection />
          <div id="features">
            <FeatureHighlights />
          </div>
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
}
