export function isVideoSrc(src?: string) {
  if (!src) return false;
  const clean = src.split('?')[0].split('#')[0].toLowerCase();
  return /\.(mp4|webm|mov|m4v)$/.test(clean);
}

export function extractMedia(text: string) {
  const matches = text.match(/(?:https?:\/\/\S+?|\/\S+?)\.(?:mp4|webm|mov|m4v)(?:\?\S*)?/gi) || [];
  let cleaned = text;
  matches.forEach((u) => {
    cleaned = cleaned.replace(u, '').replace(/\s{2,}/g, ' ').trim();
  });
  return { text: cleaned, media: matches };
}

export function MediaSlot({
  src,
  className = 'w-full h-full object-cover',
  label,
}: {
  src: string;
  className?: string;
  label?: string;
}) {
  if (isVideoSrc(src)) {
    return (
      <video
        className={className}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        title={label}
        aria-label={label}
      />
    );
  }
  return (
    <div
      className={className}
      style={{ backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      title={label}
      role="img"
      aria-label={label}
    />
  );
}
