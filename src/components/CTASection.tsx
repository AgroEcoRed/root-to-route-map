import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24">
      <div className="container">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-hero p-12 sm:p-16 text-center">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-wheat rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-earth rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-display text-primary-foreground mb-4">
              Sumate a la red agroecológica
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Registrá tu producción, encontrá compradores cercanos y formá parte de una economía alimentaria más justa y sustentable.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-wheat text-wheat-foreground hover:bg-wheat/90 font-semibold" asChild>
                <Link to="/registro">
                  Registrarme ahora
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/mapa">Explorar el mapa</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
