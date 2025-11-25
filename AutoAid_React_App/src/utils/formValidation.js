/**
 * Form Validation Utilities
 * Shared validation functions for AutoAid service forms
 */

/**
 * Validates Pakistani phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(03\d{2}-?\d{7})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validates car model year
 * @param {string} modelString - Model string containing year
 * @returns {object} - {isValid: boolean, year: number|null, error: string|null}
 */
export const validateModelYear = (modelString) => {
    const currentYear = new Date().getFullYear();
    const yearMatch = modelString.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
    
    if (!yearMatch) {
        return {
            isValid: false,
            year: null,
            error: `Please include a valid year (1950-${currentYear}) in the model`
        };
    }
    
    const year = parseInt(yearMatch[0]);
    if (year < 1950 || year > currentYear) {
        return {
            isValid: false,
            year,
            error: `Year must be between 1950 and ${currentYear}`
        };
    }
    
    return {
        isValid: true,
        year,
        error: null
    };
};

/**
 * Validates "Other" manufacturer field when selected
 * @param {string} carCompany - Selected car company
 * @param {string} otherCompany - Other company name entered
 * @returns {boolean} - True if valid
 */
export const validateOtherManufacturer = (carCompany, otherCompany) => {
    if (carCompany === 'Other' && !otherCompany.trim()) {
        return false;
    }
    return true;
};

/**
 * Car manufacturer options (standard across forms)
 */
export const manufacturerOptions = [
    { value: '', label: 'Select Manufacturer', disabled: true },
    { value: 'Toyota', label: 'Toyota' },
    { value: 'Honda', label: 'Honda' },
    { value: 'Suzuki', label: 'Suzuki' },
    { value: 'Hyundai', label: 'Hyundai' },
    { value: 'Kia', label: 'Kia' },
    { value: 'MG', label: 'MG' },
    { value: 'Changan', label: 'Changan' },
    { value: 'Other', label: 'Other' }
];

/**
 * Gets current year for validation
 */
export const getCurrentYear = () => new Date().getFullYear();
