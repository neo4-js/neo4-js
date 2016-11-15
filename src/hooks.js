import { BaseError } from './errors';

/**
 * Hooks:
 * 
 * (1)
 * - validate
 * 
 * (2)
 * - beforeCreate
 * - beforeDelete
 * - beforeFind
 * - beforeUpdate
 * 
 * (*)
 * - create
 * - find
 * - delete
 * - update
 * 
 * (3)
 * - afterCreate
 * - afterDelete
 * - afterFind
 * - afterUpdate
 */
const hookTypes = [
  'validate',

  'beforeCreate',
  'beforeDelete',
  'beforeFind',
  'beforeUpdate',

  'afterCreate',
  'afterDelete',
  'afterFind',
  'afterUpdate'
];

export default class Hooks {
  /**
   * @param {Object} definitions
   * @param {Model} model
   */
  init(definitions = {}, model) {
    this.model = model;

    const keys = Object.keys(definitions);
    const notInHookTypes = keys.filter(d => !hookTypes.find(h => h === d));
    if (notInHookTypes.length) {
      throw new BaseError('Hooks not available yet: ' + notInHookTypes.join(', '));
    }

    this.hooks = definitions;
  }

  execute(type, instance) {
    if (this.hooks[type]) {
      return this.hooks[type].apply(instance, [ instance ]);
    }
  }
}