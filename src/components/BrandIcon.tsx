import Image from "next/image";

type BrandIconProps = {
  className?: string;
  size?: number;
};

export default function BrandIcon({ className = "", size = 32 }: BrandIconProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/95 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/favicon.ico"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        unoptimized
        className="h-full w-full object-contain"
      />
    </span>
  );
}
