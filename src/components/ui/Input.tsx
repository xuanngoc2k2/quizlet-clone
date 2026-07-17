import { InputHTMLAttributes, forwardRef } from "react"

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-primary-700">{label}</label>}
        <input
          ref={ref}
          className={`rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-primary-300 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 touch-target ${className ?? ""}`}
          {...props}
        />
      </div>
    )
  },
)

Input.displayName = "Input"
