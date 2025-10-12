import { validateEtaRequest } from '../validation/etaSchemas.js';
import { getEta } from '../services/etaService.js';
import { EasyQError } from '../../config/error.js';
import { httpStatusCode } from '../../util/statusCode.js';
import { logError } from '../../config/logger.js';

export const etaController = async (req, res, next) => {
    try {
        const payload = req.body || {};
        const { value, error } = validateEtaRequest(payload);
        if (error) {
            throw new EasyQError('ValidationError', httpStatusCode.BAD_REQUEST, true, error.message);
        }

        const result = await getEta(value);

        return res.status(httpStatusCode.OK).json({
            status: 'success',
            data: result
        });
    } catch (err) {
        logError(err, { endpoint: '/api/orchestrator/eta' });
        if (err instanceof EasyQError) return next(err);
        return next(new EasyQError('InternalServerError', httpStatusCode.INTERNAL_SERVER_ERROR, true, 'Failed to compute ETA'));
    }
};


