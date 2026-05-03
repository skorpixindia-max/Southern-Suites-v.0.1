import { Check } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Your Details' },
  { number: 2, label: 'Payment' },
  { number: 3, label: 'Confirmed' },
]

type Props = {
  currentStep: 1 | 2 | 3
}

export default function BookingSteps({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, idx) => {
        const isDone = step.number < currentStep
        const isActive = step.number === currentStep
        const isUpcoming = step.number > currentStep

        return (
          <div key={step.number} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-[#C9A84C] text-[#1B2A4A]'
                    : isActive
                    ? 'bg-[#1B2A4A] text-white ring-4 ring-[#1B2A4A]/20'
                    : 'bg-[#1B2A4A]/10 text-[#1B2A4A]/30'
                }`}
              >
                {isDone ? <Check size={16} strokeWidth={3} /> : step.number}
              </div>
              <span
                className={`text-xs mt-1.5 font-medium ${
                  isActive ? 'text-[#1B2A4A]' : isDone ? 'text-[#C9A84C]' : 'text-[#1B2A4A]/30'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 transition-all duration-300 ${
                  step.number < currentStep ? 'bg-[#C9A84C]' : 'bg-[#1B2A4A]/15'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
