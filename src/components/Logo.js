import React from 'react'

const makeLetterStyles = num => visible =>
  visible
    ? {
        opacity: 1,
        transition: '1.5s cubic-bezier(0.6, 0, 0.8, 1)',
        transitionDelay: 0.4 + num * 0.3 + 's',
      }
    : {
        opacity: 0,
        transition: '1s cubic-bezier(0.6, 0, 0.8, 1)',
      }

const styles = {
  circle: visible =>
    visible
      ? {
          // strokeDasharray: '400,400',
          opacity: 1,
          transition: '2s cubic-bezier(0.3, 0, 0, 1)',
          transitionDelay: '.3s',
        }
      : {
          // strokeDasharray: '0,400',
          opacity: 0,
          transition: '1s cubic-bezier(0, 0, 0.8, 1)',
        },
  line: visible =>
    visible
      ? {
          strokeDasharray: '100,100',
          transition: '.3s cubic-bezier(0.3, 0.8, 0, 1)',
          transitionDelay: '3.5s',
        }
      : {
          strokeDasharray: '0,100',
          transition: '.1s ease-in',
        },
  zero: visible =>
    visible
      ? { opacity: 1, transition: '1.5s ease-in-out' }
      : { opacity: 0, transition: '1.5s ease-in' },
  z: makeLetterStyles(1),
  e: makeLetterStyles(2),
  r: makeLetterStyles(3),
  r2: makeLetterStyles(4),
  o: makeLetterStyles(5),
}

export default function Logo({ fill = '#000', visible = true, ...rest }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 512 132"
      {...rest}
    >
      <g id="logo">
        <circle
          cx="66"
          cy="66"
          r="63"
          fill="none"
          stroke={fill}
          strokeWidth="6"
          transform="rotate(122 66 66)"
          style={styles.circle(visible)}
        />
        <path
          fill={fill}
          style={styles.zero(visible)}
          d="M66 32c7.28 0 12.76 2.92 16.43 8.76 3.74 5.77 5.61 14.17 5.61 25.2 0 11.01-1.87 19.44-5.6 25.28C78.75 97.08 73.27 100 66 100c-7.28 0-12.8-2.92-16.53-8.76-3.68-5.84-5.51-14.27-5.51-25.29s1.83-19.42 5.5-25.2C53.22 34.93 58.73 32 66 32zm0 7.18c-4.26 0-7.45 2.1-9.55 6.3-2.03 4.2-3.05 11.02-3.05 20.47s1.02 16.3 3.05 20.57c2.1 4.2 5.29 6.3 9.55 6.3 4.2 0 7.35-2.1 9.45-6.3 2.1-4.27 3.15-11.12 3.15-20.57 0-9.38-1.05-16.17-3.15-20.37-2.1-4.26-5.25-6.4-9.45-6.4z"
        />
        <path
          stroke={fill}
          strokeWidth="6"
          style={styles.line(visible)}
          d="M43.5 101l45-70"
        />
      </g>
      <g fill={fill}>
        <path
          style={styles.z(visible)}
          d="M218.63 33.14v7.35l-32.52 50.64h32.52l-1.05 7.73H176V91.6l32.8-50.84h-29.37v-7.63h39.2z"
        />
        <path
          style={styles.e(visible)}
          d="M283.34 33.14l-1.05 7.25h-25.47v21.46h22.13v7.25h-22.13v22.5h27.28v7.26h-36.34V33.14h35.58z"
        />
        <path
          style={styles.r(visible)}
          d="M333.33 71h-10.2v27.86h-9.07V33.14h17.26c8.2 0 14.4 1.56 18.6 4.68 4.26 3.11 6.4 7.75 6.4 13.92 0 4.58-1.19 8.3-3.54 11.16-2.35 2.86-5.91 5.02-10.68 6.49l17.74 29.47h-10.78L333.33 71zm-1.05-6.95c4.77 0 8.36-.96 10.78-2.87 2.41-1.97 3.62-5.11 3.62-9.44 0-4.07-1.24-7-3.72-8.77-2.42-1.85-6.33-2.77-11.73-2.77h-8.1v23.84h9.15z"
        />
        <path
          style={styles.r2(visible)}
          d="M406.33 71h-10.2v27.86h-9.06V33.14h17.26c8.2 0 14.4 1.56 18.6 4.68 4.25 3.11 6.38 7.75 6.38 13.92 0 4.58-1.17 8.3-3.52 11.16-2.36 2.86-5.92 5.02-10.69 6.49l17.74 29.47h-10.77L406.33 71zm-1.05-6.95c4.77 0 8.36-.96 10.78-2.87 2.41-1.97 3.62-5.11 3.62-9.44 0-4.07-1.24-7-3.72-8.77-2.41-1.85-6.32-2.77-11.73-2.77h-8.1v23.84h9.15z"
        />
        <path
          style={styles.o(visible)}
          d="M482.7 32c5.53 0 10.36 1.34 14.49 4 4.2 2.61 7.44 6.46 9.73 11.55 2.35 5.08 3.53 11.25 3.53 18.5 0 7.12-1.18 13.22-3.53 18.3-2.3 5.1-5.53 8.97-9.73 11.64-4.13 2.67-8.96 4.01-14.5 4.01-5.53 0-10.4-1.3-14.59-3.91-4.13-2.6-7.37-6.45-9.73-11.54-2.29-5.09-3.43-11.22-3.43-18.4 0-7.06 1.14-13.17 3.43-18.32 2.36-5.15 5.63-9.06 9.83-11.73 4.2-2.73 9.03-4.1 14.5-4.1zm0 7.44c-5.73 0-10.18 2.16-13.36 6.48-3.18 4.33-4.77 11.07-4.77 20.22 0 9.1 1.6 15.77 4.77 20.03 3.24 4.26 7.7 6.4 13.35 6.4 12.08 0 18.12-8.85 18.12-26.52 0-17.74-6.04-26.61-18.12-26.61z"
        />
      </g>
    </svg>
  )
}
