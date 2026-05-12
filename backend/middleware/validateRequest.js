import { z } from 'zod';

const validateRequest = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
        res.status(400);
        // Extremely defensive: check issues and errors (aliases in Zod)
        const issues = result.error.issues || result.error.errors || [];
        const message = issues.length > 0 
            ? issues.map(err => err.message).join(', ')
            : 'Validation failed';
            
        const error = new Error(message);
        error.errors = issues;
        return next(error);
    }
    
    next();
};

export default validateRequest;
