/**
 * Input Validation Utility for عافيتك (Afiyatak)
 * Provides validation functions for phone, password, name, national ID, license, and XSS prevention
 */

// Phone validation (Yemeni format)
// Accepts formats: +967XXXXXXXXX, 967XXXXXXXXX, 0XXXXXXXXX, 7XXXXXXXX
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, error: 'رقم الهاتف مطلوب' }
  }

  const cleaned = phone.replace(/[\s\-()]/g, '')

  // Yemeni phone number patterns
  const yemenPatterns = [
    /^\+967(7[0-9]{8})$/,   // +9677XXXXXXXX
    /^967(7[0-9]{8})$/,     // 9677XXXXXXXX
    /^0?(7[0-9]{8})$/,      // 7XXXXXXXX or 07XXXXXXXX
  ]

  const isValid = yemenPatterns.some((pattern) => pattern.test(cleaned))

  if (!isValid) {
    return {
      valid: false,
      error: 'رقم الهاتف غير صالح. يرجى إدخال رقم يمني صحيح (مثال: 9677XXXXXXXX+)',
    }
  }

  return { valid: true }
}

// Password validation
// Requirements: at least 8 characters, one uppercase, one lowercase, one digit
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length === 0) {
    return { valid: false, error: 'كلمة المرور مطلوبة' }
  }

  if (password.length < 8) {
    return { valid: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' }
  }

  if (password.length > 128) {
    return { valid: false, error: 'كلمة المرور طويلة جداً' }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل' }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل' }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'كلمة المرور يجب أن تحتوي على رقم واحد على الأقل' }
  }

  return { valid: true }
}

// Name validation (Arabic names)
// Accepts Arabic letters, spaces, and common Arabic name characters
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'الاسم مطلوب' }
  }

  const trimmed = name.trim()

  if (trimmed.length < 2) {
    return { valid: false, error: 'الاسم قصير جداً' }
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'الاسم طويل جداً' }
  }

  // Allow Arabic letters, spaces, and Arabic diacritics (tashkeel)
  const arabicNamePattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s]+$/

  if (!arabicNamePattern.test(trimmed)) {
    return { valid: false, error: 'الاسم يجب أن يحتوي على أحرف عربية فقط' }
  }

  return { valid: true }
}

// National ID validation (Yemeni national ID: 9 digits)
export function validateNationalId(id: string): { valid: boolean; error?: string } {
  if (!id || id.trim().length === 0) {
    return { valid: false, error: 'رقم الهوية مطلوب' }
  }

  const cleaned = id.replace(/[\s\-]/g, '')

  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'رقم الهوية يجب أن يحتوي على أرقام فقط' }
  }

  if (cleaned.length !== 9) {
    return { valid: false, error: 'رقم الهوية يجب أن يتكون من 9 أرقام' }
  }

  return { valid: true }
}

// License number validation
export function validateLicenseNumber(license: string): { valid: boolean; error?: string } {
  if (!license || license.trim().length === 0) {
    return { valid: false, error: 'رقم الترخيص مطلوب' }
  }

  const trimmed = license.trim()

  if (trimmed.length < 3) {
    return { valid: false, error: 'رقم الترخيص قصير جداً' }
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'رقم الترخيص طويل جداً' }
  }

  // Allow alphanumeric and common separator characters
  if (!/^[A-Za-z0-9\u0600-\u06FF\-\/\s]+$/.test(trimmed)) {
    return { valid: false, error: 'رقم الترخيص يحتوي على أحرف غير مسموحة' }
  }

  return { valid: true }
}

// Sanitize input (prevent XSS)
export function sanitizeInput(input: string): string {
  if (!input) return ''

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
}

// Sanitize object recursively
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value)
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized as T
}

// Location validation
function validateLocation(location: string): { valid: boolean; error?: string } {
  if (!location || location.trim().length === 0) {
    return { valid: false, error: 'الموقع مطلوب' }
  }

  if (location.trim().length < 2) {
    return { valid: false, error: 'الموقع قصير جداً' }
  }

  return { valid: true }
}

// License expiry date validation
function validateLicenseExpiry(date: string): { valid: boolean; error?: string } {
  if (!date || date.trim().length === 0) {
    return { valid: false, error: 'تاريخ انتهاء الترخيص مطلوب' }
  }

  const expiryDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (isNaN(expiryDate.getTime())) {
    return { valid: false, error: 'تاريخ غير صالح' }
  }

  if (expiryDate <= today) {
    return { valid: false, error: 'يجب أن يكون تاريخ انتهاء الترخيص في المستقبل' }
  }

  return { valid: true }
}

// Validate nurse registration form
export function validateNurseRegistration(data: Record<string, string>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // First name
  const firstNameResult = validateName(data.firstName || '')
  if (!firstNameResult.valid) errors.firstName = firstNameResult.error!

  // Second name
  const secondNameResult = validateName(data.secondName || '')
  if (!secondNameResult.valid) errors.secondName = secondNameResult.error!

  // Third name
  const thirdNameResult = validateName(data.thirdName || '')
  if (!thirdNameResult.valid) errors.thirdName = thirdNameResult.error!

  // Last name
  const lastNameResult = validateName(data.lastName || '')
  if (!lastNameResult.valid) errors.lastName = lastNameResult.error!

  // Phone
  const phoneResult = validatePhone(data.phone || '')
  if (!phoneResult.valid) errors.phone = phoneResult.error!

  // Location
  const locationResult = validateLocation(data.location || '')
  if (!locationResult.valid) errors.location = locationResult.error!

  // National ID
  const nationalIdResult = validateNationalId(data.nationalId || '')
  if (!nationalIdResult.valid) errors.nationalId = nationalIdResult.error!

  // License number
  const licenseResult = validateLicenseNumber(data.licenseNumber || '')
  if (!licenseResult.valid) errors.licenseNumber = licenseResult.error!

  // License expiry
  const expiryResult = validateLicenseExpiry(data.licenseExpiryDate || '')
  if (!expiryResult.valid) errors.licenseExpiryDate = expiryResult.error!

  // Password
  const passwordResult = validatePassword(data.password || '')
  if (!passwordResult.valid) errors.password = passwordResult.error!

  // Confirm password
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'كلمة المرور غير متطابقة'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

// Validate beneficiary registration form
export function validateBeneficiaryRegistration(data: Record<string, string>): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Name
  const nameResult = validateName(data.name || '')
  if (!nameResult.valid) errors.name = nameResult.error!

  // Phone
  const phoneResult = validatePhone(data.phone || '')
  if (!phoneResult.valid) errors.phone = phoneResult.error!

  // Location
  const locationResult = validateLocation(data.location || '')
  if (!locationResult.valid) errors.location = locationResult.error!

  // Password
  const passwordResult = validatePassword(data.password || '')
  if (!passwordResult.valid) errors.password = passwordResult.error!

  // Confirm password
  if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'كلمة المرور غير متطابقة'
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
