// Pure validation functions for the contact form.
// Kept framework-free and side-effect-free so they can be unit tested.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateName(value) {
  const trimmed = (value ?? '').trim();
  if (trimmed.length < 2) return 'Ingresa tu nombre (mínimo 2 caracteres).';
  if (trimmed.length > 80) return 'El nombre es demasiado largo.';
  return null;
}

export function validateEmail(value) {
  const trimmed = (value ?? '').trim();
  if (!EMAIL_PATTERN.test(trimmed)) return 'Ingresa un correo electrónico válido.';
  return null;
}

export function validateMessage(value) {
  const trimmed = (value ?? '').trim();
  if (trimmed.length < 10) return 'Cuéntanos un poco más (mínimo 10 caracteres).';
  if (trimmed.length > 2000) return 'El mensaje es demasiado largo (máximo 2000 caracteres).';
  return null;
}

export function validatePassword(value) {
  const trimmed = value ?? '';
  if (trimmed.length < 8) return 'La contraseña debe tener mínimo 8 caracteres.';
  if (trimmed.length > 72) return 'La contraseña es demasiado larga.';
  return null;
}

// Returns { valid, errors } where errors maps field name → Spanish message.
export function validateContactForm({ name, email, message, honeypot }) {
  // Bots fill hidden fields; silently treat as valid to avoid tipping them off,
  // but flag it so the submit handler can skip sending.
  if ((honeypot ?? '') !== '') {
    return { valid: true, errors: {}, bot: true };
  }
  const errors = {};
  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const messageError = validateMessage(message);
  if (nameError) errors.name = nameError;
  if (emailError) errors.email = emailError;
  if (messageError) errors.message = messageError;
  return { valid: Object.keys(errors).length === 0, errors, bot: false };
}
