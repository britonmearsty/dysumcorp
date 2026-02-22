"use client";

import Image from "next/image";

import { FadeIn, Stagger, StaggerItem } from "./animations";

const integrations = [
  {
    name: "Google Drive",
    desc: "Auto-sync to specific shared folders.",
    logo: "/Google_Drive.png",
  },
  {
    name: "Dropbox",
    desc: "Direct API integration for speed.",
    logo: "/Dropbox.png",
  },
  {
    name: "OneDrive",
    desc: "Seamless for Microsoft 365 teams.",
    comingSoon: true,
    logo: "/OneDrive.png",
  },
  {
    name: "AWS S3",
    desc: "Enterprise-grade storage archiving.",
    comingSoon: true,
    logo: "/s3.png",
  },
];

export default function IntegrationsSection() {
  return (
    <section className="py-32 px-6 bg-[#fafaf9]" id="integrations">
      <div className="max-w-7xl mx-auto text-center">
        <FadeIn>
          <span className="text-stone-500 font-bold tracking-[0.3em] uppercase text-xs">
            Sync & Automate
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 serif-font mb-20 text-[#1c1917]">
            Integrated with your stack
          </h2>
        </FadeIn>

        <Stagger
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          delay={0.1}
        >
          {integrations.map((integration, index) => (
            <StaggerItem key={index}>
              <div className="p-10 rounded-[2.5rem] border border-stone-100 bg-white hover:premium-shadow transition-all duration-500 group text-center h-full relative">
                {integration.comingSoon && (
                  <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full border border-amber-200">
                    Coming Soon
                  </div>
                )}
                <div className="mb-6 flex justify-center items-center h-16">
                  <Image
                    alt={integration.name}
                    className="object-contain max-h-16 w-auto"
                    height={64}
                    src={integration.logo}
                    width={80}
                  />
                </div>
                <h4 className="font-bold serif-font text-xl mb-2 text-[#1c1917]">
                  {integration.name}
                </h4>
                <p className="text-xs text-stone-600">{integration.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
