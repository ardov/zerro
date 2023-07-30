export const withPerf = <T extends Array<any>, U>(
  name: string,
  fn: (...args: T) => U
) => {
  return (...args: T): U => {
    const t0 = performance.now()
    const res = fn(...args)
    const time = +(performance.now() - t0).toFixed(4)
    //@ts-ignore
    if (window?.zerro?.logsShow) console.log('⏱ ' + name.padEnd(32, ' '), time)

    //@ts-ignore
    if (window.zerro) {
      //@ts-ignore
      window.zerro.logs ??= {}
      //@ts-ignore
      window.zerro.logs[name] ??= []
      //@ts-ignore
      window.zerro.logs[name].push(time)
    }
    return res
  }
}
