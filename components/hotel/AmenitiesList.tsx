const AMENITY_MAP: Record<string, { icon: string; label: string }> = {
  'WiFi': { icon: '📶', label: 'Free WiFi' },
  'Free WiFi': { icon: '📶', label: 'Free WiFi' },
  'AC': { icon: '❄️', label: 'Air Conditioning' },
  'Air Conditioning': { icon: '❄️', label: 'Air Conditioning' },
  'Pool': { icon: '🏊', label: 'Swimming Pool' },
  'Swimming Pool': { icon: '🏊', label: 'Swimming Pool' },
  'Parking': { icon: '🅿️', label: 'Free Parking' },
  'Free Parking': { icon: '🅿️', label: 'Free Parking' },
  'Restaurant': { icon: '🍽️', label: 'Restaurant' },
  'Gym': { icon: '🏋️', label: 'Fitness Centre' },
  'Fitness Centre': { icon: '🏋️', label: 'Fitness Centre' },
  'Spa': { icon: '💆', label: 'Spa' },
  'Room Service': { icon: '🛎️', label: 'Room Service' },
  'TV': { icon: '📺', label: 'Television' },
  'Geyser': { icon: '🚿', label: 'Hot Water (Geyser)' },
  'Hot Water': { icon: '🚿', label: 'Hot Water' },
  'Laundry': { icon: '👔', label: 'Laundry Service' },
  'Power Backup': { icon: '⚡', label: 'Power Backup' },
  'CCTV': { icon: '📹', label: 'CCTV Security' },
  'Bar': { icon: '🍺', label: 'Bar' },
  'Conference Hall': { icon: '🏛️', label: 'Conference Hall' },
  'Conference Room': { icon: '🏛️', label: 'Conference Room' },
  'Banquet Hall': { icon: '🎉', label: 'Banquet Hall' },
  'Balcony': { icon: '🌅', label: 'Balcony' },
  'Sea View Rooms': { icon: '🌊', label: 'Sea View Rooms' },
  'River View Rooms': { icon: '🏞️', label: 'River View Rooms' },
  'Pure Veg Restaurant': { icon: '🥗', label: 'Pure Veg Restaurant' },
  'Prasadam Counter': { icon: '🙏', label: 'Prasadam Counter' },
  'Luggage Storage': { icon: '🧳', label: 'Luggage Storage' },
  'Garden': { icon: '🌿', label: 'Garden' },
  '24hr Reception': { icon: '🕐', label: '24-hr Reception' },
  'Mini Bar': { icon: '🍾', label: 'Mini Bar' },
  'Safe': { icon: '🔒', label: 'In-room Safe' },
  'Elevator': { icon: '🛗', label: 'Elevator' },
}

type Props = {
  amenities: string[]
}

export default function AmenitiesList({ amenities }: Props) {
  if (!amenities || amenities.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {amenities.map((amenity) => {
        const mapped = AMENITY_MAP[amenity]
        return (
          <div
            key={amenity}
            className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-[#1B2A4A]/8"
          >
            <span className="text-xl" aria-hidden="true">
              {mapped?.icon ?? '✅'}
            </span>
            <span className="text-xs font-medium text-[#1B2A4A]/70 leading-tight">
              {mapped?.label ?? amenity}
            </span>
          </div>
        )
      })}
    </div>
  )
}
