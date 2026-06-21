import Image from "next/image";

type WordVisualImageProps = {
  sizes: string;
  src: string;
};

export function WordVisualImage({ sizes, src }: WordVisualImageProps) {
  return (
    <Image
      alt=""
      className="word-card__visual-image"
      fill
      loading="eager"
      sizes={sizes}
      src={src}
      unoptimized
    />
  );
}
