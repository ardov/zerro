import {
  articleLanguages,
  articlePath,
  siteOrigin,
  type ArticleRoute,
} from '../../6-shared/pageRoutes'

/** Shared by the HTTP document and the client router. */
export function PageHead({
  article,
  includeTitleAndDescription = true,
}: {
  article?: ArticleRoute
  includeTitleAndDescription?: boolean
}) {
  const { title, description } = article ?? {
    title: 'Zerro • Планируйте деньги и достигайте целей',
    description:
      'Zerro помогает правильно распределять деньги и вести бюджет. Вы всегда будете знать сколько и на что ушло.',
  }
  const url = siteOrigin + (article?.path ?? '')
  return (
    <>
      {includeTitleAndDescription && <title>{title}</title>}
      {includeTitleAndDescription && (
        <meta name="description" content={description} />
      )}
      <meta property="og:title" content={title} />
      <meta
        property="og:description"
        content={
          article
            ? description
            : 'Zerro помогает правильно распределять деньги и вести бюджет'
        }
      />
      <meta
        property="og:locale"
        content={article?.language === 'en' ? 'en_US' : 'ru_RU'}
      />
      <meta property="og:url" content={url} />
      <meta property="twitter:title" content={article ? title : 'Zerro'} />
      <meta property="twitter:description" content={description} />
      {article && (
        <>
          <link rel="canonical" href={url} />
          {articleLanguages.map(language => (
            <link
              key={language}
              rel="alternate"
              hrefLang={language}
              href={siteOrigin + articlePath(article.id, language)}
            />
          ))}
        </>
      )}
    </>
  )
}
