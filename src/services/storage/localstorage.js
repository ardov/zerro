const LocalStorage = {
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value))
  },

  get: key =>
    localStorage.getItem(key)
      ? JSON.parse(localStorage.getItem(key))
      : localStorage.getItem(key),

  clear: () => localStorage.clear(),
}

export default LocalStorage
