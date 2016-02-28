'use strict'
var assert = require('assert')
global.ViewModel = require('view-model')
global.myVM = ViewModel()
global.emptyFn = function() {}
/* global ViewModel, myVM, emptyFn */

context('Instantiate', () => {
  before('hijack console.info', () => {
    /* global consoleVal, cache */
    global.consoleVal = null
    global.cache = console.info
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
      const ViewModel = require('view-model')
      const myVM = ViewModel(true)
      assert.strictEqual(consoleVal, 'EventRouter is logging calls')
    }),
    it('can set the underlying EventRouter to NOT console log calls by instantiating with a falsey value', () => {
      const ViewModel = require('view-model')
      const myVM = ViewModel()
      assert.strictEqual(consoleVal, null)
    })
  })
})

context('Interface', () => {
  describe('.create(key, extend_members)', () => {
    afterEach(() => {
      myVM.destroy('Test')
    })
    it('returns true after model is created', () => {
      assert.strictEqual(myVM.create('Test'), true)
    })
    it('returns false when model already exists', () => {
      myVM.create('Test')
      assert.strictEqual(myVM.create('Test'), false)
    })

    context('extend_members', () => {
      it('adds extend_members object to the newly created model', () => {
        myVM.create('Test', {
          property: 'value',
          getValue() {
            return 'computed value'
          }
        })
        myVM.run('Test', function() {
          var model_members = Object.keys(this)
          assert.strictEqual(model_members.includes('property'), true, 'the Test model includes property')
          assert.strictEqual(this.property, 'value', 'this.property equals "value"')
          assert.strictEqual(model_members.includes('getValue'), true, 'the Test model includes getValue')
          assert.strictEqual(this.getValue(), 'computed value', 'this.getValue() equals "computed value"')
        })
      })

      it('model members\' are read-only', () => {
        myVM.create('Test', {
          delta: 0
        })
        myVM.run('Test', function() {
          assert.throws(() => {
            this.delta += 1
          }, TypeError, 'cannot modify a model member value')
        })
      })

      it('model members are not extensible', () => {
        myVM.create('Test')
        myVM.run('Test', function() {
          assert.throws(() => {
            this.forgotToAdd = 'value'
          }, TypeError, 'cannot extend model members after the model has been created')
      })
    })
    })
  })

  describe('.exists(key)', () => {
    it('returns true when model exists', () => {
      myVM.create('Test')
      assert.strictEqual(myVM.exists('Test'), true)
    })
    it('returns false when model does not exist', () => {
      assert.strictEqual(myVM.exists('DoesNotExist'), false)
    })
  })

  describe('.run(key, funcToRun)', () => {
    it('returns true after function has been run', () => {
      myVM.create('Test')
      assert.strictEqual(myVM.run('Test', emptyFn), true)
    })

    it('returns false when model does not exist', () => {
      assert.strictEqual(myVM.run('DoesNotExist', emptyFn), false)
    })

    context('funcToRun', () => {
      it('binds to the model key, so all standard model members are available using this', () => {
        myVM.run('Test', function() {
          var model_members = Object.keys(this)
          assert.strictEqual(model_members.length, 2, 'there are 2 standard model members')

          assert.deepStrictEqual(model_members.includes('name'), true, 'this.name exists')
          assert.deepStrictEqual(model_members.includes('emit'), true, 'this.emit exists')
        })
      })

      it('will not work when passing arrow function, since arrow disrupts bind', () => {
        myVM.run('Test', () => {
          var model_members = Object.keys(this)
          assert.strictEqual(model_members.length, 0, 'an arrow function does not allow binding the standard model members')
        })
      })
    })
  })

  describe('.add(key, methods)', () => {
    before(() => {
      myVM.destroy('Test')
    })
    it('returns a results object showing which listeners were added (true) and which were not (false) -- those which were not added already exist on the model', () => {
      myVM.create('Test')
      assert.deepStrictEqual(myVM.add('Test', {
        listener1: emptyFn
      }), {
        listener1: true
      }, 'listener1 was added')
    })
    it('returns false when model does not exist', () => {
      assert.deepStrictEqual(myVM.add('DoesNotExist', {
        listener1: emptyFn,
        listener2: emptyFn
      }), false)
    })
  })

  describe('.remove(key, methods)', () => {
    before(() => {
      myVM.destroy('Test')
    })

    it('returns a results object showing which listeners were removed (true) and which were not (false) -- those which were not removed did not exist on the model', () => {
      myVM.create('Test')
      myVM.add('Test', {
        listener1: emptyFn,
        listener2: emptyFn
      })

      assert.deepStrictEqual(myVM.remove('Test', {
        listener1: emptyFn
      }), {
        listener1: true
      }, 'listener1 was removed')

      assert.deepStrictEqual(myVM.remove('Test', {
        listener1: emptyFn,
        listener2: emptyFn
      }), {
        listener1: false,
        listener2: true
      }, 'listener1 was not removed (it was already removed previously). listener2 was removed.')
    })

    it('returns false when model does not exist', () => {
      assert.deepStrictEqual(myVM.remove('DoesNotExist', {
        listener1: emptyFn,
        listener2: emptyFn
      }), false)
    })
  })

  describe('.destroy(key)', () => {
    it('returns true after the model has been deleted', () => {
      myVM.create('Test')
      assert.strictEqual(myVM.destroy('Test'), true)
    })
    it('returns false when the model does not exist', () => {
      assert.strictEqual(myVM.destroy('DoesNotExist'), false)
    })
  })
})

context('Standard Model Members', () => {
  describe('this.name', () => {
    it('returns the name of the model as a string', () => {
      myVM.create('Test')
      var outer_scope = null

      myVM.run('Test', function() {
        outer_scope = 'I am running inside model ' + this.name
      })

      assert.strictEqual(outer_scope, 'I am running inside model Test')
    })
  })
  describe('this.emit(name, data)', () => {
    it('emits data to all model listener methods registered under this name', () => {
      myVM.create('Test')
      var test_data = [1, 2, 3]
      var test_str = ''

      /*
        Note: the three event listener methods are all named the same, however, they actually are different objects in memory
      */
      myVM.add('Test', {
        receiveSomeData(numbers) {
          test_str += 'a'
          assert.strictEqual(numbers, test_data, 'first event listener was called')
        },
      })
      myVM.add('Test', {
        receiveSomeData(array) {
          test_str += 'b'
          assert.strictEqual(array, test_data, 'second event listener was called')
        }
      })
      myVM.add('Test', {
        receiveSomeData(data) {
          test_str += 'c'
          assert.strictEqual(data, test_data, 'third event listener was called')
        }
      })

      myVM.run('Test', function() {
        this.emit('receiveSomeData', test_data)
      })

      assert.strictEqual(test_str, 'abc', 'all three event listener methods were called and each one added a character to test_str')
    })
  })
})