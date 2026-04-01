import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Input = forwardRef(
  (
    {
      label,
      error,
      icon: Icon,
      suffixIcon: SuffixIcon,
      className,
      type = 'text',
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
              'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
              Icon && 'pl-10',
              SuffixIcon && 'pr-10',
              error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : '',
              className
            )}
            {...props}
          />
          {SuffixIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <SuffixIcon className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
