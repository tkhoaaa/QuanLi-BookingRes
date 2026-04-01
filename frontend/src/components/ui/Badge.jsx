import { cn } from '../../lib/utils'

const colorVariants = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  accent: 'bg-accent/10 text-accent-dark',
  danger: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
}

export default function Badge({
  children,
  variant = 'default',
  className,
  dot = false,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
        colorVariants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', {
            'bg-gray-500': variant === 'default',
            'bg-primary': variant === 'primary',
            'bg-secondary': variant === 'secondary',
            'bg-accent': variant === 'accent',
            'bg-red-500': variant === 'danger',
            'bg-yellow-500': variant === 'warning',
            'bg-blue-500': variant === 'info',
            'bg-green-500': variant === 'success',
          })}
        />
      )}
      {children}
    </span>
  )
}
