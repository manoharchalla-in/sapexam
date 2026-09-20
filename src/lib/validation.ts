export interface ValidationResult {
  isValid: boolean;
  nameError?: string;
  emailError?: string;
  cleanName: string;
  cleanEmail: string;
}

export function validateCandidateInput(name: string, email: string): ValidationResult {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  let isValid = true;
  let nameError: string | undefined;
  let emailError: string | undefined;

  if (!cleanName) {
    nameError = 'Full Name is required';
    isValid = false;
  } else if (cleanName.length < 2) {
    nameError = 'Full Name must be at least 2 characters long';
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail) {
    emailError = 'Email address is required';
    isValid = false;
  } else if (!emailRegex.test(cleanEmail)) {
    emailError = 'Please enter a valid email address';
    isValid = false;
  }

  return {
    isValid,
    nameError,
    emailError,
    cleanName,
    cleanEmail,
  };
}
