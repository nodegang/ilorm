'use strict';

const modelsMap = require('./models.map');

const { IS_NEW, } = require('./fields');

/**
 * Class representing a Model
 */
let Model = class Model {
  /**
   * Construct a new instance of the model
*   */
  constructor() {
    Object.defineProperties(this, {
      [IS_NEW]: {
        value: true,
        writable: true,
      },
    });
  }

  /**
   * Return the schema associated with the current model
   * @param {Schema} schema the schema returned by the function
   * @return {Schema} the schema associate with the model
   */
  static getSchema() {
    throw new Error('Missing Schema binding with the Model');
  }

  /**
   * Return the unique name of the model
   * @return {String} The model name
   */
  static getName() {
    throw new Error('Missing Name binding with the Model');
  }

  /**
   * Get the connector associate with the model
   * @return {Connector} The connector associate with the current model
   */
  static getConnector() {
    throw new Error('Missing connector binding with the Model');
  }

  /**
   * Get the connector associate with the model
   * @return {Object} The plugins options associate with the current model
   */
  static getPluginsOptions() {
    throw new Error('Missing plugins options binding with the Model');
  }

  /**
   * Instantiate a raw json object to an instance representing the data model
   * @param {Object} rawObject the raw object to instantiate
   * @Returns {Model} The model instance
   */
  static instantiate(rawObject = {}) {
    const Class = modelsMap.get(this.constructor.getName());

    return new Class(rawObject);
  }

  /**
   * Get the instance of the model linked with the given id
   * @param {ID} id The id of the target model
   * @return {Model} A model instance
   */
  static async getById(id) {
    const rawInstance = await this.constructor.getConnector().getById(id);

    const instance = this.instantiate(rawInstance);

    instance[IS_NEW] = false;

    return instance;
  }

  /**
   * Create a query targeting the model
   * @param {Query} Query inject the resulting query
   * @return {Query} return the query binded with the model
   */
  static query(Query) {
    return new Query();
  }

  /**
   * Remove the current instance from the database
   * @return {null} null
   */
  remove() {
    if (this[IS_NEW]) {
      throw new Error('Can not remove an unsaved instance');
    }

    const query = this.getQueryPrimary();

    return this.constructor.getConnector().removeOne(query);
  }

  /**
   * Save the current instance in db
   * @return {null} null
   */
  async save() {
    if (this[IS_NEW]) {
      const rawJson = await this.getJson();

      await this.constructor.getConnector().create(rawJson);

      this[IS_NEW] = false;

      return this;
    }

    const query = this.getQueryPrimary();

    const update = {};

    await this.constructor.getConnector().updateOne(query, update);

    return this;
  }

  /**
   * Generate a query targeting the primary key of the instance
   * @returns {Object} Return the query to use to target the current instance
   */
  getQueryPrimary() {
    throw new Error('Missing overload by the connector model');
  }

  /**
   * Return json associated with the curent instance
   * @return {Object} The json associated with the instance
   */
  getJson() {
    const schema = this.constructor.getSchema();

    return schema.initInstance(this);
  }
};

/**
 * Overload model class by another (to plugin)
 * @param {Model} Class A new Model to replace the current one (plugin)
 * @returns {void} Return nothing
 */
const overload = Class => {
  Model = Class;
  Model.overload = overload;
};

Model.overload = overload;

module.exports = Model;
