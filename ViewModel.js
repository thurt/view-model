'use strict'
const ROUTE = require('event-router')
const myVMs = {}
const myName = 'ViewModel'

function _modelMethods(key, extend_methods) {
  var base_methods = {
    name: key,
    emit(name, data) {
      ROUTE.send(key, name, data)
    },
    add(name, cb) {
      ROUTE.add(key, name, cb)
    }
  }
  return Object.freeze(Object.assign(base_methods, extend_methods))
}

module.exports = {
  // Create a new model
  create(key, extend_methods) {
    if (myVMs[key]) return console.warn(myName, 'cannot create model', key, '--it already exists')
    myVMs[key] = _modelMethods(key, extend_methods)
  },
  // Run a function once inside of an existing model
  run(key, funcToRun, ...args) {
    if (!myVMs[key]) return console.warn(myName, 'cannot run function for model', key, '--it does not exist')
    funcToRun.apply(myVMs[key], args)
  },
  // Add event listeners to an existing model
  add(key, methods) {
    if (!myVMs[key]) return console.error(myName, 'cannot add event listeners to', key, '--it does not exist')
    
    for (let name in methods) {
      methods[name] = methods[name].bind(myVMs[key])
      ROUTE.add(key, name, methods[name])
    }
  },
  // Remove event listeners from an existing model
  remove(key, methods) {
    if (!myVMs[key]) return console.error(myName, 'cannot remove event listeners from model', key, '--it does not exist')
    for (let name in methods) {
      ROUTE.remove(key, name, methods[name])
    }
  },
  // Delete an existing model and all event listeners of that model
  delete(key) {
    if (!myVMs[key]) return console.warn(myName, 'cannot delete model', key, '--it does not exist')
    ROUTE.purge(key)
    delete myVMs[key]
  }
}