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
    const func = async () => {
      try {
        const stream = await download(media_url_prefix + filename)
        saveStream(success, path, stream, filename)
        recover.push(filename)
        console.log(`Recover ${filename}`)
      } catch (err) {
        handleError(err, filename, i)
      }
    }
    func()
  }
  parentPort.postMessage(recover)
}

oldStreamRecover()