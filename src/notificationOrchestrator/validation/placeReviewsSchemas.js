import Joi from 'joi';

export const validatePlaceReviewsRequest = (data) => {
    const schema = Joi.object({
        origin: Joi.object({
            lat: Joi.number().min(-90).max(90).required(),
            lng: Joi.number().min(-180).max(180).required()
        }).required(),
        description: Joi.string().trim().max(500).required(),
        fullAddress: Joi.string().trim().max(500).optional(),
        street: Joi.string().trim().max(200).optional(),
        city: Joi.string().trim().max(100).optional(),
        state: Joi.string().trim().max(100).optional(),
        pincode: Joi.string().trim().max(10).optional()
    });

    return schema.validate(data);
};
