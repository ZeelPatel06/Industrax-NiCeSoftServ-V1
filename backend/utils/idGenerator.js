/**
 * Generates a unique business ID (e.g., MAT-001)
 * @param {import('mongoose').Model} model - The Mongoose model to search
 * @param {string} prefix - The 3-letter prefix (e.g., 'MAT')
 * @param {string} fieldName - The field name where the ID is stored (e.g., 'materialCode')
 * @param {string} ownerId - The owner's ID to scope the unique search
 * @returns {Promise<string>} - The generated ID
 */
const generateBusinessId = async (model, prefix, fieldName, ownerId) => {
    try {
        // Find the record with the "highest" numeric part for this owner and prefix
        const lastRecord = await model.findOne({ owner: ownerId, [fieldName]: new RegExp(`^${prefix}-`) })
            .sort({ [fieldName]: -1 })
            .select(fieldName);

        let nextNum = 1;
        if (lastRecord && lastRecord[fieldName]) {
            const parts = lastRecord[fieldName].split('-');
            if (parts.length > 1) {
                const num = parseInt(parts[parts.length - 1]);
                if (!isNaN(num)) {
                    nextNum = num + 1;
                }
            }
        }

        // Pad with zeros (at least 3 digits)
        const paddedNum = nextNum.toString().padStart(3, '0');
        return `${prefix}-${paddedNum}`;
    } catch (error) {
        console.error(`Error generating ID for ${prefix}:`, error);
        // Fallback or rethrow? For safety, let's return a timestamped one if something fails
        return `${prefix}-${Date.now().toString().slice(-6)}`;
    }
};

export { generateBusinessId };
