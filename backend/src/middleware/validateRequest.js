const mongoose = require("mongoose");

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const validateField = (fieldName, value, rules = {}) => {
  const errors = [];

  if ((value === undefined || value === null || value === "") && rules.required) {
    errors.push(`${fieldName} is required`);
    return errors;
  }

  if (value === undefined || value === null || value === "") {
    return errors;
  }

  if (rules.type === "string") {
    if (typeof value !== "string") {
      errors.push(`${fieldName} must be a string`);
      return errors;
    }

    if (rules.minLength && value.trim().length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(rules.patternMessage || `${fieldName} is invalid`);
    }
  }

  if (rules.type === "email") {
    if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.push(`${fieldName} must be a valid email address`);
    }
  }

  if (rules.type === "number") {
    if (typeof value !== "number" || Number.isNaN(value)) {
      errors.push(`${fieldName} must be a number`);
      return errors;
    }

    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${fieldName} must be at least ${rules.min}`);
    }
  }

  if (rules.type === "boolean" && typeof value !== "boolean") {
    errors.push(`${fieldName} must be a boolean`);
  }

  if (rules.type === "array") {
    if (!Array.isArray(value)) {
      errors.push(`${fieldName} must be an array`);
      return errors;
    }

    if (rules.itemType) {
      const invalidItem = value.find((item) => typeof item !== rules.itemType);
      if (invalidItem !== undefined) {
        errors.push(`${fieldName} items must be ${rules.itemType} values`);
      }
    }
  }

  if (rules.type === "object" && !isPlainObject(value)) {
    errors.push(`${fieldName} must be an object`);
  }

  if (rules.type === "objectId" && !mongoose.Types.ObjectId.isValid(value)) {
    errors.push(`${fieldName} must be a valid ObjectId`);
  }

  if (rules.enum && !rules.enum.includes(value)) {
    errors.push(`${fieldName} must be one of: ${rules.enum.join(", ")}`);
  }

  return errors;
};

const collectErrors = (sourceName, schema = {}, payload = {}) =>
  Object.entries(schema).flatMap(([fieldName, rules]) =>
    validateField(`${sourceName}.${fieldName}`, payload[fieldName], rules)
  );

const validateRequest = (schema) => (req, res, next) => {
  const errors = [
    ...collectErrors("body", schema.body, req.body),
    ...collectErrors("params", schema.params, req.params),
    ...collectErrors("query", schema.query, req.query),
  ];

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Validation failed",
      errors,
    });
  }

  return next();
};

module.exports = { validateRequest };