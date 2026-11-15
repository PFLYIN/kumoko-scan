import { useState } from 'react';
import { BookOpen } from 'lucide-react';

// Capa da obra com placeholder quando nao ha imagem (ou ela falha ao carregar).
// width/height declaram a proporcao 2:3 da capa (evita layout shift mesmo fora de um container com aspect-ratio);
// o tamanho exibido continua vindo do CSS. Use a variante adequada: capaThumbUrl em cards, capaMediaUrl no detalhe.
export default function ObraCover({ src, alt, className = '', width = 360, height = 540 }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = src && failedSrc !== src;

  return (
    <div className={`relative overflow-hidden bg-ink-800 ${className}`}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
          className="size-full object-cover"
        />
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-ink-700 to-ink-850 text-zinc-500">
          <BookOpen className="size-10" aria-hidden="true" />
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  );
}
