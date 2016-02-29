'use strict'
const EventRouter = require('event-router')

module.exports = function ViewModel(shouldLogEvents) {
  const M = {} // models
  var R // router

  if (shouldLogEvents) {
    R = EventRouter(true)
  } else {
    R = EventRouter(false)
  }

  // Get a list of all model names
  function ViewModel() {
    return Object.keys(M)
  }
  // Create a new model
  ViewModel.create = function(key, extend_members) {
    var model = M[key]
    if (model !== undefined) return false

    model = M[key] = Object.create(null)
    model.instance = modelInstance(key)
    model.listeners = new WeakMap() // for mapping listener to it's model-bound copy
    Object.freeze(Object.assign(model.instance, extend_members))

    return true
  }
  // Run a function inside of a model
  ViewModel.run = function(key, funcToRun, ...args) {
    var model = M[key]
    if (model === undefined) return false

    funcToRun.apply(model.instance, args)
    return true
  }
  // Check if a model exists
  ViewModel.exists = function(key) {
    if (M[key] === undefined) return false
    return true
  }
  // Delete an existing model and all event listeners of that model
  ViewModel.destroy = function(key) {
    if (M[key] === undefined) return false

    R.purge(key)
    delete M[key]

    return true
  }
  // Add event listeners to this model
  ViewModel.add = function(key, methods) {
    var results = {}
    var model = M[key]
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
  ViewModel.remove = function(key, methods) {
    var results = {}
    var model = M[key]
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
  }

  // closure over model key
  function modelInstance(_key) {
    return {
      // The name of this model
      name: _key,
      // Emit an event on this model
      emit(name, data) {
        R.emit(_key, name, data)
      }
    }
  }
  return ViewModel
}