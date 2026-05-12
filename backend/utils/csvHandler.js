import { Parser } from 'json2csv';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

/**
 * Converts an array of objects to a CSV string.
 * @param {Array} data - Array of objects to convert.
 * @param {Array} fields - Optional fields to include.
 */
export const jsonToCsv = (data, fields) => {
    try {
        const opts = fields ? { fields } : {};
        const parser = new Parser(opts);
        return parser.parse(data);
    } catch (err) {
        console.error('CSV Generation Error:', err);
        throw err;
    }
};

/**
 * Parses a CSV buffer into an array of objects.
 * @param {Buffer} buffer - The file buffer.
 */
export const parseCsv = async (buffer) => {
    return new Promise((resolve, reject) => {
        const results = [];
        const stream = Readable.from(buffer);

        stream
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
};
