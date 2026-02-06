import { tv } from "tailwind-variants";

export const title = tv({
  base: "tracking-tight inline font-semibold",
  variants: {
    color: {
      teal: "from-[#10B981] to-[#0D9488]",
      emerald: "from-[#34D399] to-[#10B981]",
      coral: "from-[#FB923C] to-[#F97316]",
      orange: "from-[#FDBA74] to-[#FB923C]",
      green: "from-[#4ADE80] to-[#22C55E]",
      mint: "from-[#5EEAD4] to-[#2DD4BF]",
      warm: "from-[#F97316] to-[#EF4444]",
      foreground: "dark:from-[#FFFFFF] dark:to-[#A3A3A3]",
    },
    size: {
      sm: "text-3xl lg:text-4xl",
      md: "text-[2.3rem] lg:text-5xl",
      lg: "text-4xl lg:text-6xl",
    },
    fullWidth: {
      true: "w-full block",
    },
  },
  defaultVariants: {
    size: "md",
  },
  compoundVariants: [
    {
      color: [
        "teal",
        "emerald",
        "coral",
        "orange",
        "green",
        "mint",
        "warm",
        "foreground",
      ],
      class: "bg-clip-text text-transparent bg-gradient-to-b",
    },
  ],
});

export const subtitle = tv({
  base: "w-full md:w-1/2 my-2 text-lg lg:text-xl text-default-600 block max-w-full",
  variants: {
    fullWidth: {
      true: "!w-full",
    },
  },
  defaultVariants: {
    fullWidth: true,
  },
});
