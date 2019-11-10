// import LZString from 'lz-string'

// function formatByteSize(bytes) {
//   if (bytes < 1024) return bytes + ' bytes'
//   else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + ' KiB'
//   else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + ' MiB'
//   else return (bytes / 1073741824).toFixed(3) + ' GiB'
// }

const LocalStorage = {}
LocalStorage.set = (key, value) => {
  // SIZE LOGGING
  //
  // if (value.map) {
  //   const fullSize = new Blob([JSON.stringify(value)]).size

  //   const withoutNull = value.map(item => {
  //     let newItem = {}
  //     Object.keys(item).forEach(key => {
  //       if (item[key]) newItem[key] = item[key]
  //     })
  //     return newItem
  //   })
  //   const withoutDeleted = withoutNull.filter(item => !item.deleted)

  //   const noNullSize = new Blob([JSON.stringify(withoutNull)]).size
  //   const noDeletedSize = new Blob([JSON.stringify(withoutDeleted)]).size
  //   console.log(
  //     `Для [${key}] обычная длина [${formatByteSize(
  //       fullSize
  //     )}], без null [${formatByteSize(
  //       noNullSize
  //     )}], без удалённых [${formatByteSize(
  //       noDeletedSize
  //     )}] а LZString [${formatByteSize(
  //       new Blob([LZString.compress(JSON.stringify(value))]).size
  //     )}]`
  //   )
  // }

  localStorage.setItem(key, JSON.stringify(value))

  // Disabled compressing
  // localStorage.setItem(key, LZString.compress(JSON.stringify(value)))
}

LocalStorage.get = key =>
  localStorage.getItem(key)
    ? // ? JSON.parse(LZString.decompress(localStorage.getItem(key)))
      JSON.parse(localStorage.getItem(key))
    : localStorage.getItem(key)

LocalStorage.remove = key => localStorage.removeItem(key)
LocalStorage.clear = () => localStorage.clear()

export default LocalStorage
