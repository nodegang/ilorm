'use strict';

const operations = require('../query/operations');
const fields = require('../query/fields');
const declareOperation = require('./helpers/declareOperation');
const SchemaField = require('./schemaField.class');

const NUMBER_OPERATIONS = [
  operations.BETWEEN,
  operations.MAX,
  operations.MIN,
];

/**
 * Class representing a Number field
 */
class Number extends SchemaField {

  /**
   * Return the query operation associated with the given schema field
   * @param {Query} query the instance of query to use
   * @return {Object} The query operations
   */
  getQueryOperations(query) {
    const queryOperations = super.getQueryOperations(query);

    queryOperations[operations.ADD] = declareOperation({
      query,
      operation: operations.ADD,
      key: this._name,
      field: fields.UPDATE,
    });

    NUMBER_OPERATIONS.forEach(operation => {
      queryOperations[operation] = declareOperation({
        query,
        operation,
        key: this._name,
      });
    });

    return queryOperations;
  }


  /**
   * Cast a value to match the specific field or throw an exception
   * @param {Mixed} value the value to cast
   * @returns {Number} value the value casted to the specific schemaField type configuration
   */
  castValue(value) {
    if (typeof value === 'number') {
      return value;
    }

    const result = parseFloat(value);

    if (isNaN(result)) {
      throw new Error(`${value} is not a valid number.`);
    }

    return result;
  }
}

module.exports = Number;
