import Image from 'next/image'

export default function OptimizedImage({ src, alt, className }) {
  if (!src) return null
  
  return (
    <Image
      src={src}
      alt={alt || 'product image'}
      width={400}
      height={400}
      loading="lazy"
      sizes="(max-width: 768px) 50vw, 33vw"
      className={className}
      style={{ objectFit: 'cover' }}
      unoptimized={false}
    />
  )
}
