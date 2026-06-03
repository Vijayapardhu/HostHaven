import React, { useState } from 'react';
import { validateField, getFieldHint, getFieldConstraints } from '@/lib/formValidation';

interface FormInputProps {
  label?: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (value: any) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: string;
  showValidationHint?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  autoComplete?: string;
  rows?: number;
}

interface FormSelectProps extends Omit<FormInputProps, 'type'> {
  options: Array<{ value: string | number; label: string }>;
}

interface FormCheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  className?: string;
}

interface FormNumberProps extends Omit<FormInputProps, 'type'> {
  min?: number;
  max?: number;
  step?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      name,
      type = 'text',
      value,
      onChange,
      onBlur,
      placeholder,
      required,
      disabled,
      minLength,
      maxLength,
      showValidationHint = true,
      validateOnBlur = false,
      validateOnChange = false,
      error: externalError,
      helperText,
      className = '',
      autoComplete,
      ...rest
    },
    ref,
  ) => {
    const [touched, setTouched] = useState(false);
    const [internalError, setInternalError] = useState('');

    const strValue = String(value);
    const characterCount = strValue.length;

    // Get field constraints from validation rules
    const constraints = getFieldConstraints(name);
    const finalMaxLength = maxLength || constraints.maxLength;
    const fieldHint = showValidationHint ? getFieldHint(name) : '';

    const handleValidation = (val: any) => {
      const result = validateField(name, val);
      if (!result.valid && result.errors.length > 0) {
        setInternalError(result.errors[0]);
      } else {
        setInternalError('');
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onChange(val);

      if (validateOnChange) {
        handleValidation(val);
      }
    };

    const handleBlur = () => {
      setTouched(true);
      if (validateOnBlur) {
        handleValidation(value);
      }
      onBlur?.();
    };

    const displayError = touched && (externalError || internalError);
    const shouldShowCounter =
      finalMaxLength && characterCount > finalMaxLength * 0.7;

    return (
      <div className={`w-full space-y-1 ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={finalMaxLength}
          autoComplete={autoComplete}
          className={`
            w-full px-3 py-2 border rounded-md transition-colors
            bg-background text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${displayError ? 'border-destructive' : 'border-input'}
          `}
          {...rest}
        />

        {displayError && (
          <p className="text-xs text-destructive font-medium">{displayError}</p>
        )}

        <div className="flex justify-between items-start gap-2">
          {fieldHint && !displayError && (
            <p className="text-xs text-muted-foreground">{fieldHint}</p>
          )}

          {shouldShowCounter && (
            <p
              className={`text-xs font-medium ml-auto ${
                characterCount >= finalMaxLength
                  ? 'text-destructive'
                  : characterCount > finalMaxLength * 0.9
                    ? 'text-orange-500'
                    : 'text-muted-foreground'
              }`}
            >
              {characterCount}/{finalMaxLength}
            </p>
          )}
        </div>

        {helperText && !fieldHint && !displayError && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  },
);

FormInput.displayName = 'FormInput';

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      name,
      value,
      onChange,
      options,
      required,
      disabled,
      showValidationHint = true,
      error: externalError,
      helperText,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const [touched, setTouched] = useState(false);

    const fieldHint = showValidationHint ? getFieldHint(name) : '';

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value);
    };

    const handleBlur = () => {
      setTouched(true);
    };

    const displayError = touched && externalError;

    return (
      <div className={`w-full space-y-1 ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border rounded-md transition-colors
            bg-background text-foreground
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${displayError ? 'border-destructive' : 'border-input'}
          `}
          {...rest}
        >
          <option value="">Select {label?.toLowerCase() || 'an option'}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {displayError && (
          <p className="text-xs text-destructive font-medium">{externalError}</p>
        )}

        {fieldHint && !displayError && (
          <p className="text-xs text-muted-foreground">{fieldHint}</p>
        )}

        {helperText && !fieldHint && !displayError && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  },
);

FormSelect.displayName = 'FormSelect';

export const FormCheckbox = React.forwardRef<HTMLInputElement, FormCheckboxProps>(
  (
    { label, name, checked, onChange, required, disabled, helperText, className = '' },
    ref,
  ) => {
    return (
      <div className={`flex items-start space-x-2 ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          id={name}
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={`
            w-4 h-4 rounded border-input border transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            cursor-pointer mt-1
          `}
        />
        <label
          htmlFor={name}
          className={`text-sm font-medium text-foreground cursor-pointer flex-1 ${
            disabled ? 'opacity-50' : ''
          }`}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
          {helperText && (
            <p className="text-xs text-muted-foreground font-normal mt-1">
              {helperText}
            </p>
          )}
        </label>
      </div>
    );
  },
);

FormCheckbox.displayName = 'FormCheckbox';

export const FormNumber = React.forwardRef<HTMLInputElement, FormNumberProps>(
  (
    {
      label,
      name,
      value,
      onChange,
      onBlur,
      placeholder,
      required,
      disabled,
      min,
      max,
      step = '1',
      showValidationHint = true,
      validateOnBlur = false,
      error: externalError,
      helperText,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const [touched, setTouched] = useState(false);
    const [internalError, setInternalError] = useState('');

    const constraints = getFieldConstraints(name);
    const finalMin = min !== undefined ? min : constraints.min;
    const finalMax = max !== undefined ? max : constraints.max;
    const fieldHint = showValidationHint ? getFieldHint(name) : '';

    const handleValidation = (val: any) => {
      const result = validateField(name, val);
      if (!result.valid && result.errors.length > 0) {
        setInternalError(result.errors[0]);
      } else {
        setInternalError('');
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      onChange(val ? Number(val) : '');
    };

    const handleBlur = () => {
      setTouched(true);
      if (validateOnBlur) {
        handleValidation(value);
      }
      onBlur?.();
    };

    const displayError = touched && (externalError || internalError);

    return (
      <div className={`w-full space-y-1 ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}

        <input
          ref={ref}
          type="number"
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          min={finalMin}
          max={finalMax}
          step={step}
          className={`
            w-full px-3 py-2 border rounded-md transition-colors
            bg-background text-foreground placeholder:text-muted-foreground
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            ${displayError ? 'border-destructive' : 'border-input'}
          `}
          {...rest}
        />

        {displayError && (
          <p className="text-xs text-destructive font-medium">{displayError}</p>
        )}

        {fieldHint && !displayError && (
          <p className="text-xs text-muted-foreground">{fieldHint}</p>
        )}

        {helperText && !fieldHint && !displayError && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  },
);

FormNumber.displayName = 'FormNumber';
