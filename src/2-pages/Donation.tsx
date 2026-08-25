import type { FC, ReactElement } from 'react'
import { Link, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '6-shared/ui/theme'

export default function Donation() {
  const { t } = useTranslation('donation')
  return (
    <>
      <title>{`${t('pageTitle')} | Zerro`}</title>
      <meta name="description" content={t('pageDescription')} />
      <link rel="canonical" href="https://zerro.app/donation" />
      <div className="flex h-full items-center justify-center">
        <div className="mx-auto max-w-[480px] p-6 pb-16">
          <Typography variant="h5" align="center" className="mb-4">
            {t('heading')}
          </Typography>

          <Typography variant="body1" align="center" className="mb-4">
            {t('subtitle')}
          </Typography>

          <div className="flex flex-col gap-4 py-4">
            <LinkCard
              icon={<PatreonLogo />}
              primary={t('patreonTitle')}
              secondary={t('patreonDescription')}
              href="https://www.patreon.com/ardov"
            />
            <LinkCard
              icon={<CardLogo />}
              primary={t('cardTitle')}
              secondary={t('cardDescription')}
              href="https://www.tinkoff.ru/sl/3zbRWFqgcT1"
            />
          </div>

          <Typography
            variant="body1"
            color="textSecondary"
            align="center"
            className="mb-4"
          >
            {t('afterword')}
          </Typography>
        </div>
      </div>
    </>
  )
}

interface LinkCardProps {
  icon: ReactElement
  primary: ReactElement | string
  secondary: ReactElement | string
  href: string
}
const LinkCard: FC<LinkCardProps> = props => {
  const { icon, primary, secondary, href } = props
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      underline="none"
      className="flex rounded-lg bg-card p-6 shadow-md"
    >
      <div className="max-w-12">{icon}</div>
      <div className="ml-4">
        <Typography variant="h6" color="textPrimary">
          {primary}
        </Typography>
        <Typography variant="body2" className="text-muted-foreground">
          {secondary}
        </Typography>
      </div>
    </Link>
  )
}

function PatreonLogo() {
  const theme = useAppTheme()
  const isDark = theme.palette.mode === 'dark'
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="6"
        y="7"
        width="6"
        height="34"
        fill={isDark ? '#ffffff' : '#052A49'}
      />
      <circle cx="29" cy="20" r="13" fill="#F96753" />
    </svg>
  )
}

function CardLogo() {
  const theme = useAppTheme()
  const mainColor = theme.palette.primary.main
  const secondaryColor = theme.palette.warning.main
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: 'rotate(-8deg)' }}
    >
      <path
        d="M6 19H42V33C42 35.2091 40.2091 37 38 37H10C7.79086 37 6 35.2091 6 33V19Z"
        fill={mainColor}
      />
      <path
        d="M6 15C6 12.7909 7.79086 11 10 11H38C40.2091 11 42 12.7909 42 15V19H6V15Z"
        fill={secondaryColor}
      />
      <circle cx="35.5" cy="30.5" r="3.5" fill={secondaryColor} />
      <circle
        cx="29.5"
        cy="30.5"
        r="4"
        fill={secondaryColor}
        stroke={mainColor}
      />
    </svg>
  )
}
