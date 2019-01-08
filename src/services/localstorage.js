import LZString from 'lz-string'

const LocalStorage = {}
LocalStorage.set = (key, value) => {
  localStorage.setItem(key, LZString.compress(JSON.stringify(value)))
}
LocalStorage.get = key => {
  if (localStorage.getItem(key))
    return JSON.parse(LZString.decompress(localStorage.getItem(key)))
}
LocalStorage.clear = key => {
  localStorage.clear()
}

export default LocalStorage
