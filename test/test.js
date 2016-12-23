'use strict'
const assert = require('assert')
const ViewModel = require('../ViewModel')
const app = ViewModel()
const emptyFn = function() {}

context('Instantiate', () => {
  let consoleVal = null
  let cache = console.info

  before('hijack console.info', () => {
    console.info = function(...args) {
      consoleVal = args.join(' ')
    }
  })
  afterEach('reset consoleVal', () => {
    consoleVal = null
  })
  after('restore console.info', () => {
    console.info = cache
    cache = null
  })
  describe('ViewModel(shouldLogCalls)', () => {
    it('can set the underlying EventRouter to console log calls by instantiating with a truthy value', () => {
      require('../ViewModel')(true)
      assert.strictEqual(consoleVal, 'EventRouter is logging calls')
    })
    it('can set the underlying EventRouter to NOT console log calls by instantiating with a falsey value', () => {
      require('../ViewModel')()
      assert.strictEqual(consoleVal, null)
    })
  })
})

context('Interface', () => {
  describe('.create(key, extend_members)', () => {
    afterEach(() => {
      app.destroy('Test')
    })
    it('returns true after model is created', () => {
      assert.strictEqual(app.create('Test'), true)
    })
    it('returns false when model already exists', () => {
      app.create('Test')
      assert.strictEqual(app.create('Test'), false)
    })

    context('extend_members', () => {
      it('adds extend_members object to the newly created model', () => {
        app.create('Test', {
          property: 'value',
          getValue() {
            return 'computed value'
          }
        })
        app.run('Test', function() {
          const model_members = Object.keys(this)
          assert.strictEqual(model_members.includes('property'), true, 'the Test model includes property')
          assert.strictEqual(this.property, 'value', 'this.property equals "value"')
          assert.strictEqual(model_members.includes('getValue'), true, 'the Test model includes getValue')
          assert.strictEqual(this.getValue(), 'computed value', 'this.getValue() equals "computed value"')
        })
      })

      it('model members are read-only', () => {
        app.create('Test', {
          delta: 0
        })
        app.run('Test', function() {
          assert.throws(() => {
            this.delta += 1
          }, TypeError, 'cannot modify a model member value')
        })
      })

      it('model members are not extensible', () => {
        app.create('Test')
        app.run('Test', function() {
          assert.throws(() => {
            this.forgotToAdd = 'value'
          }, TypeError, 'cannot extend model members after the model has been created')
      })
    })
    })
  })

  describe('.exists(key)', () => {
    it('returns true when model exists', () => {
      app.create('Test')
      assert.strictEqual(app.exists('Test'), true)
    })
    it('returns false when model does not exist', () => {
      assert.strictEqual(app.exists('DoesNotExist'), false)
    })
  })

  describe('.run(key, funcToRun)', () => {
    it('returns true after function has been run', () => {
      app.create('Test')
      assert.strictEqual(app.run('Test', emptyFn), true)
    })

    it('returns false when model does not exist', () => {
      assert.strictEqual(app.run('DoesNotExist', emptyFn), false)
    })

    context('funcToRun', () => {
      it('binds to the model key, so all standard model members are available using this', () => {
        app.run('Test', function() {
          const model_members = Object.keys(this)
          assert.strictEqual(model_members.length, 2, 'there are 2 standard model members')

          assert.deepStrictEqual(model_members.includes('name'), true, 'this.name exists')
          assert.deepStrictEqual(model_members.includes('emit'), true, 'this.emit exists')
        })
      })

      it('will not work when passing arrow function, since arrow disrupts bind', () => {
        app.run('Test', () => {
          const model_members = Object.keys(this)
          assert.strictEqual(model_members.length, 0, 'an arrow function does not allow binding the standard model members')
        })
      })
    })
  })

  describe('.add(key, methods)', () => {
    before(() => {
      app.destroy('Test')
    })
    it('returns a results object showing which listeners were added (true) and which were not (false) -- those which were not added already exist on the model', () => {
      app.create('Test')
      assert.deepStrictEqual(app.add('Test', {
        listener1: emptyFn
      }), {
        listener1: true
      }, 'listener1 was added')
    })
    it('returns false when model does not exist', () => {
      assert.deepStrictEqual(app.add('DoesNotExist', {
        listener1: emptyFn,
        listener2: emptyFn
      }), false)
    })
  })

  describe('.remove(key, methods)', () => {
    before(() => {
      app.destroy('Test')
    })

    it('returns a results object showing which listeners were removed (true) and which were not (false) -- those which were not removed did not exist on the model', () => {
      app.create('Test')
      app.add('Test', {
        listener1: emptyFn,
        listener2: emptyFn
      })

      assert.deepStrictEqual(app.remove('Test', {
        listener1: emptyFn
      }), {
        listener1: true
      }, 'listener1 was removed')

      assert.deepStrictEqual(app.remove('Test', {
        listener1: emptyFn,
        listener2: emptyFn
      }), {
        listener1: false,
        listener2: true
      }, 'listener1 was not removed (it was already removed previously). listener2 was removed.')
    })

    it('returns false when model does not exist', () => {
      assert.deepStrictEqual(app.remove('DoesNotExist', {
        listener1: emptyFn,
        listener2: emptyFn
      }), false)
    })
  })

  describe('.destroy(key)', () => {
    it('returns true after the model has been deleted', () => {
      app.create('Test')
      assert.strictEqual(app.destroy('Test'), true)
    })
    it('returns false when the model does not exist', () => {
      assert.strictEqual(app.destroy('DoesNotExist'), false)
    })
  })

  describe('.getModelNames()', () => {
    it('returns an array of model names as string', () => {
      app.create('Test')
      app.create('Test2')
      app.create('Test3')
      const modelNames = app.getModelNames()
      assert.strictEqual(modelNames.includes('Test'), true)
      assert.strictEqual(modelNames.includes('Test2'), true)
      assert.strictEqual(modelNames.includes('Test3'), true)
    })
  })
})

context('Standard Model Members', () => {
  describe('this.name', () => {
    it('returns the name of the model as a string', () => {
      app.create('Test')
      let outer_scope = null

      app.run('Test', function() {
        outer_scope = 'I am running inside model ' + this.name
      })

      assert.strictEqual(outer_scope, 'I am running inside model Test')
    })
  })
  describe('this.emit(name, data)', () => {
    it('emits data to all model listener methods registered under this name', () => {
      app.create('Test')
      const test_data = [1, 2, 3]
      let test_str = ''

      /*
        Note: the three event listener methods are all named the same, however, they actually are different objects in memory
      */
      app.add('Test', {
        receiveSomeData(numbers) {
          test_str += 'a'
          assert.strictEqual(numbers, test_data, 'first event listener was called')
        },
      })
      app.add('Test', {
        receiveSomeData(array) {
          test_str += 'b'
          assert.strictEqual(array, test_data, 'second event listener was called')
        }
      })
      app.add('Test', {
        receiveSomeData(data) {
          test_str += 'c'
          assert.strictEqual(data, test_data, 'third event listener was called')
        }
      })

      app.run('Test', function() {
        this.emit('receiveSomeData', test_data)
      })

      assert.strictEqual(test_str, 'abc', 'all three event listener methods were called and each one added a character to test_str')
    })
  })
})
