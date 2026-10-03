import { HTMLAttributes, forwardRef } from "react"

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 ${hover ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""} ${className ?? ""}`}
        {...props}
      />
    )
  },
)

Card.displayName = "Card"
