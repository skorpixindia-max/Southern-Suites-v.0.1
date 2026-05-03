type Props = {
  savings: number
}

export default function PriceBadge({ savings }: Props) {
  if (!savings || savings <= 0) return null

  return (
    <span className="inline-flex items-center gap-1 bg-[#C9A84C] text-[#1B2A4A] text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
      Save ₹{Math.round(savings).toLocaleString('en-IN')} vs OTA
    </span>
  )
}
