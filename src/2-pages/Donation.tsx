import React, { FC } from 'react'
import { Box, Link, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { Helmet } from 'react-helmet'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from '6-shared/ui/theme'

export default function Donation() {
  const { t } = useTranslation('donation')
  return (
    <>
      <Helmet>
        <title>{t('pageTitle')} | Zerro</title>
        <meta name="description" content={t('pageDescription')} />
        <link rel="canonical" href="https://zerro.app/donation" />
      </Helmet>

      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100%"
      >
        <Box p={3} pb={8} mx="auto" maxWidth={480}>
          <Typography variant="h5" align="center" paragraph>
            {t('heading')}
          </Typography>

          <Typography variant="body1" align="center" paragraph>
            {t('subtitle')}
          </Typography>

          <Stack spacing={2} py={2}>
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
          </Stack>

          <Typography
            variant="body1"
            color="textSecondary"
            align="center"
            paragraph
          >
            {t('afterword')}
          </Typography>
        </Box>
      </Box>
    </>
  )
}

interface LinkCardProps {
  icon: JSX.Element
  primary: JSX.Element | string
  secondary: JSX.Element | string
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
      sx={{
        p: 3,
        borderRadius: 1,
        bgcolor: 'background.paper',
        display: 'flex',
        boxShadow: 2,
      }}
    >
      <Box maxWidth={48}>{icon}</Box>
      <Box ml={2}>
        <Typography variant="h6" color="textPrimary">
          {primary}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {secondary}
        </Typography>
      </Box>
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
