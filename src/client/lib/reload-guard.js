/**
 * Holds a pending page reload (a new release taking over) while something
 * must not be interrupted, such as the metronome playing. The reload runs as
 * soon as the last hold is released, or right away if nothing holds it.
 */
export function createReloadGuard(reload) {
  let holds = 0
  let pending = false

  return {
    /** Holds reloads until the returned release function is called (extra calls do nothing). */
    hold() {
      holds++
      let released = false
      return () => {
        if (released) return
        released = true
        holds--
        if (holds === 0 && pending) {
          pending = false
          reload()
        }
      }
    },
    /** Reloads now, or once every hold is released. */
    request() {
      if (holds === 0) reload()
      else pending = true
    },
  }
}

const guard = createReloadGuard(() => location.reload())
export const holdReload = () => guard.hold()
export const requestReload = () => guard.request()
