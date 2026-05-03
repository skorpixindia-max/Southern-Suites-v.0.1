type Props = {
  mapEmbedCode: string | null | undefined
}

export default function HotelMap({ mapEmbedCode }: Props) {
  if (!mapEmbedCode || mapEmbedCode.trim() === '') return null

  return (
    <div
      className="w-full rounded-2xl overflow-hidden border border-[#1B2A4A]/8"
      style={{ aspectRatio: '16/9', minHeight: '300px' }}
      dangerouslySetInnerHTML={{ __html: mapEmbedCode }}
    />
  )
}
