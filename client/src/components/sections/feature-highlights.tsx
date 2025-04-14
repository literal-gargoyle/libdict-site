import { FileUp, Shuffle, Check, FolderOpen, Share2, Smartphone } from "lucide-react";

export function FeatureHighlights() {
  const features = [
    {
      icon: <FileUp className="text-white text-xl" />,
      title: "PDF to .libdict Conversion",
      description: "Convert any PDF into a structured format optimized for fast loading and sharing.",
      color: "bg-primary"
    },
    {
      icon: <Shuffle className="text-white text-xl" />,
      title: "Smart Shuffling",
      description: "Shuffle cards randomly for better memory retention and to avoid order-based memorization.",
      color: "bg-secondary"
    },
    {
      icon: <Check className="text-white text-xl" />,
      title: "Remove on Correct Answer",
      description: "Cards you've mastered get removed from the active pool, letting you focus on what needs practice.",
      color: "bg-accent"
    },
    {
      icon: <FolderOpen className="text-white text-xl" />,
      title: "Custom Section Loader",
      description: "Load specific sections of your dictionary for focused study sessions on particular topics.",
      color: "bg-primary"
    },
    {
      icon: <Share2 className="text-white text-xl" />,
      title: "Deck Sharing",
      description: "Share your decks with friends or the LibDict community to collaborate on learning.",
      color: "bg-secondary"
    },
    {
      icon: <Smartphone className="text-white text-xl" />,
      title: "Mobile Friendly",
      description: "Study on any device with our responsive design optimized for mobile, tablet, and desktop.",
      color: "bg-accent"
    }
  ];

  return (
    <div className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 font-['Outfit'] sm:text-4xl">
            Powerful Features for Better Learning
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Our tools help you learn faster and remember longer.
          </p>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index} className="relative bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition duration-300 ease-in-out">
                <div className={`absolute -top-4 -left-4 w-12 h-12 ${feature.color} rounded-full flex items-center justify-center`}>
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900 pt-2 font-['Outfit']">{feature.title}</h3>
                <p className="mt-2 text-base text-gray-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
