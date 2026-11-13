type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  sm: "w-8 h-8",
  md: "w-9 h-9",
  lg: "w-11 h-11",
};

/** Shared SaathiPro mark — same asset as PWA / home-screen icon */
export default function BrandLogo({ size = "md", className = "" }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/icon.svg"
      alt="SaathiPro"
      width={size === "lg" ? 44 : size === "sm" ? 32 : 36}
      height={size === "lg" ? 44 : size === "sm" ? 32 : 36}
      className={`${sizeClass[size]} rounded-xl shadow-glow object-cover shrink-0 ${className}`}
    />
  );
}
