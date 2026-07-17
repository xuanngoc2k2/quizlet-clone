import { HTMLAttributes, forwardRef } from "react"

type CardProps = HTMLAttributes<HTMLDivElement>

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-xl border bg-white p-4 shadow-sm ${className ?? ""}`}
        {...props}
      />
    )
  },
)

Card.displayName = "Card"
