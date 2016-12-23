'use strict'
const EventRouter = require('event-router')

module.exports = function ViewModel(shouldLogEvents) {
  const R = EventRouter(shouldLogEvents) // router
  const M = {} // models

  // closure over model key
  const modelInstance = (_key) => {
    return {
      // The name of this model
      name: _key,
      // Emit an event on this model
      emit(name, data) {
        R.emit(_key, name, data)
      }
    }
  }

  return Object.freeze({
    // Create a new model
    create(key, extend_members) {
      let model = M[key]
      if (model !== undefined) return false

      model = M[key] = Object.create(null)
      model.instance = modelInstance(key)
      model.listeners = new WeakMap() // for mapping listener to it's model-bound copy
      Object.freeze(Object.assign(model.instance, extend_members))

      return true
    },
    // Run a function inside of a model
    run(key, funcToRun, ...args) {
      const model = M[key]
      if (model === undefined) return false

      funcToRun.apply(model.instance, args)
      return true
    },
    // Check if a model exists
    exists(key) {
      if (M[key] === undefined) return false
      return true
    },
    // Delete an existing model and all event listeners of that model
    destroy(key) {
      if (M[key] === undefined) return false

      R.purge(key)
      delete M[key]

      return true
    },
    // Add event listeners to this model
    add(key, methods) {
      const results = {}
      const model = M[key]
      if (model === undefined) return false

      for (let name in methods) {
        let method = methods[name]
        let boundMethod
        if (typeof method !== 'function') {
          results[name] = false
          continue
        }
        if (model.listeners.has(method)) {
          boundMethod = model.listeners.get(method)
        } else {
          boundMethod = method.bind(model.instance)
          model.listeners.set(method, boundMethod)
        }
        results[name] = R.add(key, name, boundMethod)
      }

      return results
    },
      // Remove event listeners from this model
    remove(key, methods) {
        const results = {}
        const model = M[key]
        if (model === undefined) return false

        for (let name in methods) {
          let method = methods[name]

          if (typeof method !== 'function') {
            results[name] = false
            continue
          }
          if (model.listeners.has(method)) {
            results[name] = R.remove(key, name, model.listeners.get(method))
          }
        }

        return results
      },
    getModelNames() {
      return Object.keys(M)
    }
  })
}