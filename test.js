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

  describe('{nested: true}', () => {
    it('returns a nested tree', () => {
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

    it('takes the page with the first sorted path w/o "/" path', () => {
      return makeTestDir([
        'foo/index.js'
      ]).then(dir => {
        expect(getPageMap({dir, nested: true}).path).toEqual('/foo')
      })
    })

    it('works with TreeModel#parse()', () => {
      const TreeModel = require('tree-model')
      return makeTestDir([
        'index.js',
        'foo/index.js',
        'foo/bar.jsx'
      ]).then(dir => {
        const pages = getPageMap({dir, nested: true})
        const tree = new TreeModel()
        const root = tree.parse(pages)
        expect(root.children.length).toBe(1)
        const foo = root.children[0]
        expect(foo.children.length).toBe(1)
        const bar = foo.children[0]
        expect(root.first(node => node.model.path === '/foo')).toEqual(foo)
        expect(root.first(node => node.model.path === '/foo/bar')).toEqual(bar)
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
