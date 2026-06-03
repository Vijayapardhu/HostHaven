import { useState, useCallback } from 'react'
import { getFieldHint, validateField } from '@/lib/formValidation'

interface FormInputProps {
  label: string
  name: string
  type?: string
  value?: string | number
  onChange?: (value: string) => void
  onBlur?: () => void
  required?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  step?: string
  rows?: number
  helperText?: string
  showValidationHint?: boolean
  validateOnBlur?: boolean
  validateOnChange?: boolean
}

export function FormInput({
  label,
  name,
  type = 'text',
  value = '',
  onChange,
  onBlur,
  required = false,
  disabled = false,
  placeholder,
  className = '',
  minLength,
  maxLength,
  min,
  max,
  pattern,
  step,
  rows,
  helperText,
  showValidationHint = true,
  validateOnBlur = true,
  validateOnChange = false,
}: FormInputProps) {
  const [error, setError] = useState<string>('')
  const [touched, setTouched] = useState(false)
  const [charCount, setCharCount] = useState(String(value).length)

  const fieldHint = helperText || getFieldHint(name)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setCharCount(newValue.length)
      onChange?.(newValue)

      if (validateOnChange && touched) {
        const result = validateField(name, newValue)
        setError(result.errors[0] || '')
      }
    },
    [name, onChange, validateOnChange, touched]
  )

  const handleBlur = useCallback(() => {
    setTouched(true)
    onBlur?.()

    if (validateOnBlur) {
      const result = validateField(name, value)
      setError(result.errors[0] || '')
    }
  }, [name, value, validateOnBlur, onBlur])

  const showError = touched && error
  const showHint = showValidationHint && fieldHint && !error

  const inputClassName = `
    w-full px-3 py-2 border rounded-lg text-sm
    focus:outline-none focus:ring-2 focus:ring-offset-2
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${showError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
    transition-colors
  `.trim()

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          rows={rows || 4}
          maxLength={maxLength}
          className={`${inputClassName} resize-none`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          min={min}
          max={max}
          pattern={pattern}
          step={step}
          className={inputClassName}
        />
      )}

      {/* Character count for text fields */}
      {maxLength && (
        <div className={`text-xs ${charCount > maxLength * 0.9 ? 'text-amber-600' : 'text-gray-500'}`}>
          {charCount}/{maxLength}
        </div>
      )}

      {/* Error message */}
      {showError && <p className="text-xs text-red-500 font-medium">{error}</p>}

      {/* Helper hint */}
      {showHint && <p className="text-xs text-gray-500">{fieldHint}</p>}

      {/* Additional helper text */}
      {!showError && !showHint && helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  )
}

interface FormSelectProps {
  label: string
  name: string
  value?: string
  onChange?: (value: string) => void
  onBlur?: () => void
  required?: boolean
  disabled?: boolean
  className?: string
  options: Array<{ value: string; label: string }>
  helperText?: string
  showValidationHint?: boolean
}

export function FormSelect({
  label,
  name,
  value = '',
  onChange,
  onBlur,
  required = false,
  disabled = false,
  className = '',
  options,
  helperText,
  showValidationHint = true,
}: FormSelectProps) {
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<string>('')

  const fieldHint = helperText || getFieldHint(name)

  const handleBlur = useCallback(() => {
    setTouched(true)
    onBlur?.()

    const result = validateField(name, value)
    setError(result.errors[0] || '')
  }, [name, value, onBlur])

  const showError = touched && error
  const showHint = showValidationHint && fieldHint && !error

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <select
        name={name}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        title={label}
        className={`w-full px-3 py-2 border rounded-lg text-sm
          focus:outline-none focus:ring-2 focus:ring-offset-2
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          ${showError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
          transition-colors
          ${className}`}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {showError && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {showHint && <p className="text-xs text-gray-500">{fieldHint}</p>}
    </div>
  )
}

interface FormCheckboxProps {
  label: string
  name: string
  checked?: boolean
  onChange?: (checked: boolean) => void
  required?: boolean
  disabled?: boolean
  className?: string
  helperText?: string
}

export function FormCheckbox({
  label,
  name,
  checked = false,
  onChange,
  required = false,
  disabled = false,
  className = '',
  helperText,
}: FormCheckboxProps) {
  return (
    <div className="space-y-1">
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className={`w-4 h-4 border-gray-300 rounded cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
        />
        <span className="text-sm text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  )
}

interface FormNumberProps extends FormInputProps {
  type?: 'number'
}

export function FormNumber({
  ...props
}: FormNumberProps) {
  return <FormInput {...props} type="number" validateOnChange={true} />
}
