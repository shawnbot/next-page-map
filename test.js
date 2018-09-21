const tmp = require('tmp')
const {ensureFile} = require('fs-extra')
const {join} = require('path')
const getPageMap = require('.')

describe('getPageMap()', () => {
  it('works', () => {
    return makeTestDir([
      'index.js',
      'foo/bar.jsx'
    ]).then(dir => {
      expect(getPageMap(dir)).toEqual({
        '/': '/index.js',
        '/foo/bar': '/foo/bar.jsx'
      })
    })
  })
})

function makeTestDir(paths) {
  return new Promise((resolve, reject) => {
    tmp.dir((error, dir, cleanup) => {
      if (error) {
        return reject(error)
      }
      const files = paths.map(path => ensureFile(join(dir, path)))
      Promise.all(files).then(() => resolve(dir))
    })
  })
}
