import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import UpcomingActivitiesSection from "@/components/UpcomingActivitiesSection";
import MesAgroecologiaBanner from "@/components/MesAgroecologiaBanner";
import FeaturesSection from "@/components/FeaturesSection";
import ActorTypesSection from "@/components/ActorTypesSection";
import TerritoriesGallery from "@/components/TerritoriesGallery";
import PartnersSection from "@/components/PartnersSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <MesAgroecologiaBanner />
      <UpcomingActivitiesSection />
      <FeaturesSection />
      <ActorTypesSection />
      <TerritoriesGallery />
      <PartnersSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
