export const withPerf = <T extends Array<any>, U>(
  name: string,
  fn: (...args: T) => U
) => {
  return (...args: T): U => {
    const t0 = performance.now()
    const res = fn(...args)
    const time = +(performance.now() - t0).toFixed(4)
    //@ts-expect-error window.zerro is an untyped debug object
    if (window?.zerro?.logsShow) console.log('⏱ ' + name.padEnd(32, ' '), time)

    //@ts-expect-error window.zerro is an untyped debug object
    if (window.zerro) {
      //@ts-expect-error window.zerro is an untyped debug object
      window.zerro.logs ??= {}
      //@ts-expect-error window.zerro is an untyped debug object
      window.zerro.logs[name] ??= []
      //@ts-expect-error window.zerro is an untyped debug object
      window.zerro.logs[name].push(time)
    }
    return res
  }
}
