import ApiError from "../utils/apiError.js";

export default function requiredFields(fields, body) {
    fields?.forEach(field => {
        if (!body[field]) {
            throw new ApiError(400, `${field} field is required!`)
        }
    });
}