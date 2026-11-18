export default function Logo({ light = false, compact = false, className = "" }: {
  light?: boolean; compact?: boolean; className?: string;
}) {
  if (compact) return <img src="/kitab-mark.svg" width={40} height={40} alt="Kitab" className={className || "h-10 w-10"} />;
  return <img src={light ? "/kitab-logo-light.svg" : "/kitab-logo.svg"} width={244} height={64}
    alt="Kitab — Ethiopian ebooks" className={className || "h-11 w-auto"} />;
}
