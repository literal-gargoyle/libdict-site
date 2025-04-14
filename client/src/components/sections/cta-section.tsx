import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <div className="bg-gradient-to-r from-primary via-primary to-secondary py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white font-['Outfit'] sm:text-4xl">
            Ready to start studying smarter?
          </h2>
          <p className="mt-4 text-xl text-primary-100">
            Join thousands of students using LibDict for more efficient learning.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-md shadow">
              <Link href="/sign-in">
                <Button 
                  variant="secondary" 
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50"
                  size="lg"
                >
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="ml-3 inline-flex">
              <Link href="#features">
                <Button 
                  variant="outline" 
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-700 bg-opacity-60 hover:bg-opacity-70"
                  size="lg"
                >
                  Learn more
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
