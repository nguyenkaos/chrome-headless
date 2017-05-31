const CDP = require('chrome-remote-interface')
const { send } = require('micro')
const ms = require('ms')
const pMemoize = require('p-memoize')

const fetchPageTitle = async (url) => {
  const client = await CDP()

  const { DOM, Network, Page, Runtime } = client

  await Promise.all([Page.enable(), DOM.enable(), Network.enable(), Runtime.enable()])

  await Page.navigate({ url })

  await Page.loadEventFired()

  const { result: { value: title } } = await Runtime.evaluate({ expression: `document.title` })

  await client.close()

  return title
}

// memoize so we don't open 1 browser per request
const getTitle = pMemoize(fetchPageTitle, { maxAge: ms('1h') })

module.exports = async (req, res) => {
  if (req.url !== '/') {
    send(res, 404, '404 Not found')
    return
  }

  try {
    const url = 'https://zeit.co/'
    const title = await getTitle(url)
    send(res, 200, { title, url })
  } catch (error) {
    console.error('Error getting title', error)
    send(res, 500, 'Error getting title, see logs for more info')
  }
}
