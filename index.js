'use strict'
const EventRouter = require('event-router')
const M = {} // models

module.exports = function(shouldLogEvents) {
  var ROUTE
  if (shouldLogEvents) {
    ROUTE = EventRouter(true)
  } else {
    ROUTE = EventRouter(false)
  }

  function _modelMethods(key, extend_methods) {
    var standard_methods = {
      name: key,
      emit(name, data) {
        ROUTE.emit(key, name, data)
      }
    }
    return Object.freeze(Object.assign(standard_methods, extend_methods))
  }

  return {
    // Create a new model
    create(key, extend_members) {
      if (M[key] !== undefined) return false

      var model = M[key] = Object.create(null)
      model.members = _modelMethods(key, extend_members)
      model.listeners = new WeakMap()

      return true
    },
    // Check if model exists
    exists(key) {
      if (M[key] !== undefined) return true

      return false
    },
    // Run a function once inside of a model
    run(key, funcToRun, ...args) {
      var model = M[key]
      if (model === undefined) return false

      funcToRun.apply(model.members, args)

      return true
    },
    // Add event listeners to a model
    add(key, methods) {
      var res = {}
      var model = M[key]
      if (model === undefined) return false

      for (let name in methods) {
        let method = methods[name]
        let boundMethod

        if (model.listeners.has(method)) {
          boundMethod = model.listeners.get(method)
        } else {
          boundMethod = method.bind(model.members)
          model.listeners.set(method, boundMethod)
        }

        res[name] = ROUTE.add(key, name, boundMethod)
      }
      return res
    },
    // Remove event listeners from a model
    remove(key, methods) {
      var res = {}
      var model = M[key]
      if (model === undefined) return false

      for (let name in methods) {
        let method = methods[name]
        if (model.listeners.has(method)) {
          res[name] = ROUTE.remove(key, name, model.listeners.get(method))
        } else {
          res[name] = false
        }
      }

      return res
    },
    // Delete an existing model and all event listeners of that model
    destroy(key) {
      if (M[key] === undefined) return false

      ROUTE.purge(key)
      delete M[key]

      return true
    }
  }
}