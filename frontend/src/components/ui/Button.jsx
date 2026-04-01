import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const variants = {
  primary:
    'bg-primary text-white hover:bg-primary-dark disabled:bg-primary/50',
  secondary:
    'bg-secondary text-white hover:bg-secondary-dark disabled:bg-secondary/50',
  outline:
    'border-2 border-primary text-primary hover:bg-primary hover:text-white disabled:border-primary/50 disabled:text-primary/50',
  ghost:
    'text-gray-600 hover:bg-gray-100 disabled:text-gray-300',
  danger:
    'bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300',
  accent:
    'bg-accent text-white hover:bg-accent-dark disabled:bg-accent/50',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2',
}

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      className,
      icon: Icon,
      iconPosition = 'left',
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
