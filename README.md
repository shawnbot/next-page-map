# next-page-map
Get a mapping of files to page paths from your [Next.js] pages directory.

## Installation
```
npm i next-page-map
```

## Usage
This can be used to build navigation trees and construct links to edit the current page on GitHub. It walks the `pages` directory synchronously, so it's best placed in your `next.config.js` and the result passed via `publicRuntimeConfig`:

```js
const getPageMap = require('next-page-map')
const pageMap = getPageMap()

module.exports = {
  publicRuntimeConfig: {pageMap},
  // the rest of your config
}
```

### Options
The `getPageMap()` default export takes an optional object of options:

| Key | Description | Default |
| :-- | :--- | :--- |
| `dir` | the directory from which to resolve `pages` | the current working directory (`process.cwd()`) |
| `pageExtensions` | an optional array of filename extensions to match | `['js', 'jsx']` |
| `nested` | a boolean to enable the [nested object format](#nested-format) | `false` |

### Map format
The default return format is an object mapping URIs (keys) to filenames (values). Both values have a leading slash, e.g.

```js
/* given the following file structure:
   pages
   ├── about
   │   ├── index.js
   │   ├── mission.js
   │   └── team.js
   ├── index.js
   └── news.js
*/

console.log(JSON.stringify(getPageMap(), null, 2))

/* outputs:
{
  "/": "/index.js",
  "/about": "/about/index.js",
  "/about/mission": "/about/mission.js",
  "/about/team": "/about/team.js",
  "/news": "/news.js"
}
*/
```

### Nested format
If you'd like to build nested navigation from the page map, you can pass `nested: true` in the options object, which causes `getPageMap()` to return a recursive structure with the form:

```js
{
  file: '/path/to/foo/index.js',  // the file name relative to <cwd>/pages
  path: '/path/to/foo',           // the URI (path minus page extension and trailing "/index")
  isIndex: true,                  // whether the file w/o extention ends in "/index"
  parent: '/path/to',             // the path of the "parent" page
  children: [<pages>]             // an array of objects whose `.parent` === this.path
}
```

## Examples

### Edit links
The [map format](#map-format) can be used to look up the filename from any component that uses Next's router, including App components:

```jsx
// pages/_app.js
import App, {Container} from 'next/app'
import getConfig from 'next/config'
const {pageMap} = getConfig().publicRuntimeConfig

// TODO: replace "<owner>" and "<repo>" with your repo's slugs,
// and replace "master" if that's not your default branch
const editBaseURL = 'https://github.com/<owner>/<repo>/edit/master/pages'
const editURL = filename => `${editBaseURL}${filename}`

export default class extends App {
  render() {
    const {pathname} = this.props.router
    const filename = pageMap[pathname]
    return (
      <Container>
        {/* render your stuff */}
        {filename && (
          <p>
            <a href={editURL(filename)}>Edit this page on GitHub</a>
          </p>
        )}
      </Container>
    )
  }
}
```

### Nested navigation
This example uses [nested format](#nested-format) with webpack's [require.context](https://webpack.js.org/guides/dependency-management/#require-context) to get a handle on the actual _components_ that each page renders, then tries to get the text for the link from its `displayName`:

```jsx
// next.config.js
const getPageMap = require('next-page-map')
const pageExtensions = ['js', 'mdx']

module.exports = {
  pageExtensions,
  publicRuntimeConfig: {
    pageExtensions,
    pageMap: getPageMap({pageExtensions, nested: true})
  }
  // ...
}
```

```jsx
// src/Nav.js
import getConfig from 'next/config'
import NextLink from 'next/link'
import {withRouter} from 'next/router'

const {pageExtensions, pageMap} = getConfig().publicRuntimeConfig

const pattern = new RegExp(`\.(${pageExtensions.join('|')}$`)
const requirePage = require.context('../pages', true, pattern)

export default function Nav(props) {
  return (
    <nav {...props}>
      <NavList links={pageMap} />
    </nav>
  )
}

const NavList = ({links, ...rest}) => (
  <ul {...rest}>
    {links.map(link => (
      <li>
        <NavLink link={page} />
      </li>
    ))}
  </ul>
)

// Note: the withRouter() HOC gives this component a `router` prop,
// which memorializes the `pathname` of the current page
const NavLink = withRouter(({link, router, ...rest}) => {
  const {file, path, children} = link
  const current = router.pathname === path
  
  // require.context().keys() returns all of the matched filenames,
  // but they're relative to the '../pages' path, so the only real
  // difference is the leading "."
  const contextPath = requirePage.keys().find(key => key === `.${file}`)
  
  let text = file
  if (contextPath) {
    const Page = requirePage(contextPath)
    text = Page.displayName || Page.name || text
  }
  return (
    <NextLink to={path}>
      <a href={path} aria-current={current} {...rest}>{text}</a>
    </NextLink>
  )
})
```

[Next.js]: https://github.com/zeit/next.js
