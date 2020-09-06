const fs = require('fs')

let string = ""

for (let i = 1; i <= 840; i++) {
  string += `file 'media_${i}.ts'\r\n`
}

fs.writeFile('R:/file.txt', string, (err) => {
  if (err) return console.error(err)
  console.log("complete")
})