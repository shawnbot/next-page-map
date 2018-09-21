const klawSync = require('klaw-sync')
const {basename, dirname, extname, join} = require('path')

const INDEX_SUFFIX = '/index'

module.exports = function getPageMap(dir, pageExtensions = ['js', 'jsx']) {
  if (!dir) {
    dir = join(process.cwd(), 'pages')
  }

  function isPage(path) {
    const ext = extname(path).substr(1)
    return pageExtensions.includes(ext) && basename(path).indexOf('_') !== 0
  }

  return klawSync(dir)
    .filter(item => !item.stats.isDirectory() && isPage(item.path))
    .reduce((pages, item) => {
      const relative = item.path.substr(dir.length)
      const path = pathname(relative)
      pages[path] = relative
      return pages
    }, {})
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
      ? path.substr(0, -INDEX_SUFFIX.length)
      : path
  }
}
