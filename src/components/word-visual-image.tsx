import Image from "next/image";

type WordVisualImageProps = {
  priority?: boolean;
  sizes: string;
  src: string;
};

export function WordVisualImage({
  priority = false,
  sizes,
  src
}: WordVisualImageProps) {
  return (
    <Image
      alt=""
      className="word-card__visual-image"
      fill
      {...(priority ? { priority: true } : { loading: "lazy" as const })}
      sizes={sizes}
      src={src}
      unoptimized
    />
  );
}
