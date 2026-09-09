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
  onOpen,
}: {
  src: string;
  className?: string;
  label?: string;
  onOpen?: (src: string, label?: string) => void;
}) {
  const open = () => onOpen?.(src, label);
  if (isVideoSrc(src)) {
    return (
      <video
        className={className + (onOpen ? ' cursor-pointer' : '')}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        title={label}
        aria-label={label}
        onClick={open}
      />
    );
  }
  return (
    <button type="button" className="block w-full h-full p-0 border-0" onClick={open} aria-label={label ? 'View ' + label : 'View image'}>
      <div
        className={className + ' cursor-pointer'}
        style={{ backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        title={label}
        role="img"
        aria-label={label}
      />
    </button>
  );
}
