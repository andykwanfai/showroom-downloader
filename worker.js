const { parentPort, workerData } = require('worker_threads')
const { download, saveStream, handleError } = require('./utils')
//try to download past streams
async function oldStreamRecover() {
  const pastStream = 50
  const recover = []
  const { media_url_prefix, success, current, path } = workerData

  for (let i = current - pastStream > 0 ? current - pastStream : 1; i < current; i++) {
    const filename = `media_${i}.ts`
    if (success.has(filename)) {
      continue
    }
    try {
      const stream = await download(media_url_prefix + filename)
      saveStream(success, path, stream, filename)
      recover.push(filename)
    } catch (err) {
      // handleError(path, err, filename, "Recover Error")
    }
  }

  if (recover.length > 0) {
    parentPort.postMessage(recover)
  }
}

oldStreamRecover()