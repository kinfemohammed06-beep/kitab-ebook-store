export default function Logo({ compact = false, className = "" }: {
  light?: boolean; compact?: boolean; className?: string;
}) {
  return <img src="/kitab-logo.png" width={480} height={246} alt="Kitab — Ethiopian ebooks"
    className={className || (compact ? "h-10 w-auto" : "h-11 w-auto")} />;
}
