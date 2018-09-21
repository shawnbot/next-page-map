# next-page-map
Get a mapping of files to page paths from your [Next.js] pages directory.

## Installation
```
npm i next-page-map
```

## Usage
This can be used to build navigation trees and construct links to edit the current page on GitHub.

```js
// in next.config.js
const getPageMap = require('next-page-map')
const pageMap = getPageMap()

module.exports = {
  publicRuntimeConfig: {pageMap},
  // the rest of your config
}
```

```jsx
// in pages/_app.js
import App, {Container} from 'next/app'
import getConfig from 'next/config'

// TODO: replace "owner" and "repo" with your repo's
// and replace "master" if that's not your default branch
const editBaseURL = 'https://github.com/owner/repo/edit/master/pages'

const {publicRuntimeConfig: {pageMap}} = getConfig()

export default class extends App {
  render() {
    const {pathname} = this.props.router
    const filename = pageMap[pathname]
    return (
      <Container>
        {/* render your stuff */}
        {filename && (
          <p>
            <a href={`${editBaseURL}${filename}`}>Edit this page on GitHub</a>
          </p>
        )}
      </Container>
    )
  }
}
```
