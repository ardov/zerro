export const withPerf = <T extends Array<any>, U>(
  name: string,
  fn: (...args: T) => U
) => {
  return (...args: T): U => {
    const t0 = performance.now()
    const res = fn(...args)
    const time = +(performance.now() - t0).toFixed(4)
    //@ts-ignore
    if (process.env.NODE_ENV === 'development' || window.logTimes)
      console.log('⏱ ' + name.padEnd(32, ' '), time)

    //@ts-ignore
    window.logging ??= {}
    //@ts-ignore
    window.logging[name] ??= []
    //@ts-ignore
    window.logging[name].push(time)
    return res
  }
}
