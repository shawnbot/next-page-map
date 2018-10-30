const klawSync = require('klaw-sync')
const {basename, dirname, extname, join} = require('path')

const INDEX_SUFFIX = '/index'
const INDEX_PATTERN = /\/index(\.[a-z]+)?$/

module.exports = function getPageMap({dir, pageExtensions, nested}) {
  if (!dir) {
    dir = join(process.cwd(), 'pages')
  }

  if (!pageExtensions) {
    pageExtensions = ['js', 'jsx']
  }

  function isPage(path) {
    const ext = extname(path).substr(1)
    return pageExtensions.includes(ext) && basename(path).indexOf('_') !== 0
  }

  const map = klawSync(dir)
    .filter(item => !item.stats.isDirectory() && isPage(item.path))
    .reduce((pages, item) => {
      const relative = item.path.substr(dir.length)
      const path = pathname(relative)
      pages[path] = relative
      return pages
    }, {})

  return nested ? nest(map) : map
}

function pathname(path) {
  const base = path.substr(0, path.lastIndexOf('.'))
  return removeIndexSuffix(base)
}

function removeIndexSuffix(path) {
  if (path === INDEX_SUFFIX) {
    return '/'
  } else {
    return path.endsWith(INDEX_SUFFIX)
      ? path.substr(0, path.length - INDEX_SUFFIX.length)
      : path
  }
}


function nest(map) {
  const nodeMap = {}
  const nodes = Object.keys(map).sort().map(path => {
    const file = map[path]
    const keys = path.substr(1).split('/')
    return nodeMap[path] = {
      path,
      file,
      isIndex: INDEX_PATTERN.test(file),
      parent: '/' + keys.slice(0, keys.length - 1).join('/'),
      children: []
    }
  })

  let root = nodeMap['/']
  if (root) {
    nodes.splice(nodes.indexOf(root), 1)
  } else {
    console.warn('no root node found in:', nodeMap)
    root = {path: '/', parent: null, children: []}
  }

  const rest = []
  while (nodes.length) {
    const node = nodes.shift()
    const parent = nodeMap[node.parent]
    if (parent) {
      parent.children.push(node)
    } else {
      rest.push(node)
    }
  }

  if (rest.length) {
    console.warn('unable to nest some pages:', rest)
  }

  return root
}
