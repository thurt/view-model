A simple ViewModel based on top of [EventRouter](https://github.com/thurt/event-router)
# TOC
   - [Instantiate](#instantiate)
     - [ViewModel(shouldLogCalls)](#instantiate-viewmodelshouldlogcalls)
   - [Interface](#interface)
     - [.create(key, extend_members)](#interface-createkey-extend_members)
       - [extend_members](#interface-createkey-extend_members-extend_members)
     - [.exists(key)](#interface-existskey)
     - [.run(key, funcToRun)](#interface-runkey-functorun)
       - [funcToRun](#interface-runkey-functorun-functorun)
     - [.add(key, methods)](#interface-addkey-methods)
     - [.remove(key, methods)](#interface-removekey-methods)
     - [.destroy(key)](#interface-destroykey)
     - [.getModelNames()](#interface-getmodelnames)
   - [Standard Model Members](#standard-model-members)
     - [this.name](#standard-model-members-thisname)
     - [this.emit(name, data)](#standard-model-members-thisemitname-data)
<a name=""></a>
 
<a name="instantiate"></a>
# Instantiate
<a name="instantiate-viewmodelshouldlogcalls"></a>
## ViewModel(shouldLogCalls)
can set the underlying EventRouter to console log calls by instantiating with a truthy value.

```js
require('../ViewModel')(true)
assert.strictEqual(consoleVal, 'EventRouter is logging calls')
```

can set the underlying EventRouter to NOT console log calls by instantiating with a falsey value.

```js
require('../ViewModel')()
assert.strictEqual(consoleVal, null)
```

<a name="interface"></a>
# Interface
<a name="interface-createkey-extend_members"></a>
## .create(key, extend_members)
returns true after model is created.

```js
assert.strictEqual(app.create('Test'), true)
```

returns false when model already exists.

```js
app.create('Test')
assert.strictEqual(app.create('Test'), false)
```

<a name="interface-createkey-extend_members-extend_members"></a>
### extend_members
adds extend_members object to the newly created model.

```js
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
```

model members are read-only.

```js
app.create('Test', {
  delta: 0
})
app.run('Test', function() {
  assert.throws(() => {
    this.delta += 1
  }, TypeError, 'cannot modify a model member value')
})
```

model members are not extensible.

```js
app.create('Test')
app.run('Test', function() {
  assert.throws(() => {
    this.forgotToAdd = 'value'
  }, TypeError, 'cannot extend model members after the model has been created')
      })
```

<a name="interface-existskey"></a>
## .exists(key)
returns true when model exists.

```js
app.create('Test')
assert.strictEqual(app.exists('Test'), true)
```

returns false when model does not exist.

```js
assert.strictEqual(app.exists('DoesNotExist'), false)
```

<a name="interface-runkey-functorun"></a>
## .run(key, funcToRun)
returns true after function has been run.

```js
app.create('Test')
assert.strictEqual(app.run('Test', emptyFn), true)
```

returns false when model does not exist.

```js
assert.strictEqual(app.run('DoesNotExist', emptyFn), false)
```

<a name="interface-runkey-functorun-functorun"></a>
### funcToRun
binds to the model key, so all standard model members are available using this.

```js
app.run('Test', function() {
  const model_members = Object.keys(this)
  assert.strictEqual(model_members.length, 2, 'there are 2 standard model members')
  assert.deepStrictEqual(model_members.includes('name'), true, 'this.name exists')
  assert.deepStrictEqual(model_members.includes('emit'), true, 'this.emit exists')
})
```

will not work when passing arrow function, since arrow disrupts bind.

```js
app.run('Test', () => {
  const model_members = Object.keys(this)
  assert.strictEqual(model_members.length, 0, 'an arrow function does not allow binding the standard model members')
})
```

<a name="interface-addkey-methods"></a>
## .add(key, methods)
returns a results object showing which listeners were added (true) and which were not (false) -- those which were not added already exist on the model.

```js
app.create('Test')
assert.deepStrictEqual(app.add('Test', {
  listener1: emptyFn
}), {
  listener1: true
}, 'listener1 was added')
```

returns false when model does not exist.

```js
assert.deepStrictEqual(app.add('DoesNotExist', {
  listener1: emptyFn,
  listener2: emptyFn
}), false)
```

<a name="interface-removekey-methods"></a>
## .remove(key, methods)
returns a results object showing which listeners were removed (true) and which were not (false) -- those which were not removed did not exist on the model.

```js
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
```

returns false when model does not exist.

```js
assert.deepStrictEqual(app.remove('DoesNotExist', {
  listener1: emptyFn,
  listener2: emptyFn
}), false)
```

<a name="interface-destroykey"></a>
## .destroy(key)
returns true after the model has been deleted.

```js
app.create('Test')
assert.strictEqual(app.destroy('Test'), true)
```

returns false when the model does not exist.

```js
assert.strictEqual(app.destroy('DoesNotExist'), false)
```

<a name="interface-getmodelnames"></a>
## .getModelNames()
returns an array of model names as string.

```js
app.create('Test')
app.create('Test2')
app.create('Test3')
const modelNames = app.getModelNames()
assert.strictEqual(modelNames.includes('Test'), true)
assert.strictEqual(modelNames.includes('Test2'), true)
assert.strictEqual(modelNames.includes('Test3'), true)
```

<a name="standard-model-members"></a>
# Standard Model Members
<a name="standard-model-members-thisname"></a>
## this.name
returns the name of the model as a string.

```js
app.create('Test')
let outer_scope = null
app.run('Test', function() {
  outer_scope = 'I am running inside model ' + this.name
})
assert.strictEqual(outer_scope, 'I am running inside model Test')
```

<a name="standard-model-members-thisemitname-data"></a>
## this.emit(name, data)
emits data to all model listener methods registered under this name.

```js
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
```

