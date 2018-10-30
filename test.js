const tmp = require('tmp')
const {ensureFile} = require('fs-extra')
const {join} = require('path')
const getPageMap = require('.')

describe('getPageMap()', () => {
  it('works', () => {
    return makeTestDir([
      'index.js',
      'foo/index.js',
      'foo/bar.jsx'
    ]).then(dir => {
      expect(getPageMap({dir})).toEqual({
        '/': '/index.js',
        '/foo': '/foo/index.js',
        '/foo/bar': '/foo/bar.jsx'
      })
    })
  })

  it('respects pageExtentions', () => {
    const pageExtensions = ['jsx']
    return makeTestDir([
      'index.js',
      'foo/index.js',
      'foo/bar.jsx'
    ]).then(dir => {
      expect(getPageMap({dir, pageExtensions})).toEqual({
        '/foo/bar': '/foo/bar.jsx'
      })
    })
  })

  it('returns a nested tree with {nested: true}', () => {
    return makeTestDir([
      'index.js',
      'foo/index.js',
      'foo/bar.jsx'
    ]).then(dir => {
      expect(getPageMap({dir, nested: true})).toEqual({
        path: '/',
        file: '/index.js',
        isIndex: true,
        parent: '/',
        children: [
          {
            path: '/foo',
            file: '/foo/index.js',
            isIndex: true,
            parent: '/',
            children: [
              {
                path: '/foo/bar',
                file: '/foo/bar.jsx',
                isIndex: false,
                parent: '/foo',
                children: []
              }
            ]
          }
        ]
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
