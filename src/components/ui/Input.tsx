import { InputHTMLAttributes, forwardRef } from "react"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <input
          ref={ref}
          className={`rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500 touch-target ${className ?? ""}`}
          {...props}
        />
      </div>
    )
  },
)

Input.displayName = "Input"
