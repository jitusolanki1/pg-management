/**
 * Database Selector Middleware
 * Automatically uses dev database for dev mode users
 */

import { getDevConnection } from "../config/database.js";

/**
 * Get appropriate model based on dev mode
 * @param {Object} req - Express request object
 * @param {mongoose.Model} ProdModel - Production database model
 * @returns {mongoose.Model} - Appropriate model for the request
 */
export function getModel(req, ProdModel) {
  // Check if dev mode from JWT
  if (req.isDevMode) {
    const devConnection = getDevConnection();
    if (devConnection) {
      const modelName = ProdModel.modelName;
      // Return existing model or create new one with same schema
      return (
        devConnection.models[modelName] ||
        devConnection.model(modelName, ProdModel.schema)
      );
    }
  }
  return ProdModel;
}

/**
 * Middleware to automatically select database
 */
export function selectDatabase(models) {
  return (req, res, next) => {
    // Attach model getter to request
    req.getModel = (modelName) => {
      const ProdModel = models[modelName];
      if (!ProdModel) {
        throw new Error(`Model ${modelName} not found`);
      }
      return getModel(req, ProdModel);
    };
    next();
  };
}

export default { getModel, selectDatabase };
