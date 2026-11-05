function makeLetterStyles(num: number) {
  return (visible: boolean) =>
    visible
      ? {
          opacity: 1,
          filter: 'blur(0px)',
          transition: '1.5s cubic-bezier(0.6, 0, 0.8, 1)',
          transitionDelay: 0.4 + num * 0.3 + 's',
        }
      : {
          opacity: 0,
          filter: 'blur(4px)',
          transition: '1s cubic-bezier(0.6, 0, 0.8, 1)',
        }
}

const styles = {
  line: (visible: boolean) =>
    visible
      ? {
          strokeDasharray: '100,100',
          transition: '.3s cubic-bezier(0.3, 0.8, 0, 1)',
          transitionDelay: '0.8s',
        }
      : {
          strokeDasharray: '0,100',
          transition: '.1s ease-in',
        },
  zero: (visible: boolean) =>
    visible
      ? { opacity: 1, transition: '1s ease-in-out' }
      : { opacity: 0, transition: '1s ease-in' },
  z: makeLetterStyles(1),
  e: makeLetterStyles(2),
  r: makeLetterStyles(3),
  r2: makeLetterStyles(4),
  o: makeLetterStyles(5),
}

/** The mark's own outlines, shared by the animated logo and the bare mark. */
const ZERO_PATH =
  'M38 1q16.65 0 25.25 12.6Q72 26.2 72 49.85q0 23.8-8.75 36.55Q54.65 99 38 99T12.6 86.4Q4 73.65 4 49.85 4 26.2 12.6 13.6 21.35 1 38 1m0 13.6q-8.05 0-11.7 8.1-3.7 8-3.7 27.15 0 19.3 3.65 27.45T38 85.4t11.7-8q3.7-8.1 3.7-27.6 0-19.3-3.65-27.3T38 14.6'
// Normalize the longer slash to the animation's existing 100-unit dash.
const SLASH_PATH = 'M3.9 96.95 72.1 3.1'

export function Logo({ fill = '#000', visible = true, ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 450 100"
      {...rest}
    >
      <g id="logo">
        <path fill={fill} style={styles.zero(visible)} d={ZERO_PATH} />
        <path
          stroke={fill}
          strokeWidth="8"
          pathLength="100"
          style={styles.line(visible)}
          d={SLASH_PATH}
        />
      </g>
      <g fill={fill}>
        <path
          style={styles.z(visible)}
          d="M137.45 71.6h34.55L170.6 82H122v-9.4l34.45-44.15h-31.65V18h46.85v9.45z"
        />
        <path
          style={styles.e(visible)}
          d="M200.2 54.15q0.35 6.8 2.8 11.1a15.4 15.4 0 0 0 6.3 6.25q3.95 2 8.6 2 4.8 0 8.8-1.45a38 38 0 0 0 8.05-4.2l5.7 7.85a37 37 0 0 1-23.05 7.9q-9.8 0-16.7-4.25a27 27 0 0 1-10.3-11.75q-3.5-7.6-3.5-17.55 0-9.6 3.45-17.15a29 29 0 0 1 10-12.05q6.5-4.45 15.5-4.45 8.45 0 14.5 3.9a25 25 0 0 1 9.35 11q3.35 7.1 3.35 17 0 1.65-0.05 3.2t-0.2 2.75zm15.8-28.1q-6.55 0-10.85 4.65t-4.95 14.5h30.5q-0.15-9.35-4-14.25-3.8-4.9-10.65-4.9"
        />
        <path
          style={styles.r(visible)}
          d="M258.15 82v-9.3h9.55v-45.5h-9.55V18h19.3l2.35 14.9q3.65-8 8.9-12.25 5.35-4.25 13.7-4.25a28 28 0 0 1 9.55 1.6l-3.8 11.05a28 28 0 0 0-7.4-1.1q-7.05 0-12.2 5.2-5.1 5.2-8.05 15.05v24.5h13V82zm42.3-40.9V25.8l1.6-7.8h9.95l-2.05 23.1z"
        />
        <path
          style={styles.r2(visible)}
          d="M326.05 82v-9.3h9.55v-45.5h-9.55V18h19.3l2.35 14.9q3.65-8 8.9-12.25 5.35-4.25 13.7-4.25a28 28 0 0 1 9.55 1.6l-3.8 11.05a28 28 0 0 0-7.4-1.1q-7.05 0-12.2 5.2-5.1 5.2-8.05 15.05v24.5h13V82zm42.3-40.9V25.8L369.9 18h9.95l-2.05 23.1z"
        />
        <path
          style={styles.o(visible)}
          d="M418.75 16.35q9.3 0 15.6 4.2a25.3 25.3 0 0 1 9.6 11.65q3.3 7.55 3.3 17.7 0 10-3.35 17.65a26.4 26.4 0 0 1-9.65 11.85q-6.35 4.2-15.6 4.2-9.2 0-15.6-4.05a26 26 0 0 1-9.7-11.65q-3.25-7.6-3.25-17.85 0-10 3.25-17.55a27 27 0 0 1 9.7-11.85q6.45-4.3 15.7-4.3m0 10.05q-7.6 0-11.4 5.75-3.85 5.7-3.85 17.85 0 12.05 3.75 17.85 3.75 5.7 11.35 5.7t11.35-5.7q3.75-5.75 3.75-17.95 0-12.1-3.75-17.8t-11.2-5.7"
        />
      </g>
    </svg>
  )
}

/** The crossed zero on its own, without the wordmark or the entrance
 * animation. */
export function LogoMark({ fill = 'currentColor', ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="-12 0 100 100"
      {...rest}
    >
      <path fill={fill} d={ZERO_PATH} />
      <path stroke={fill} strokeWidth="8" d={SLASH_PATH} />
    </svg>
  )
}
