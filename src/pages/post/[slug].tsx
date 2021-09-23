import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Comments from '../../components/Comments';
import { RichText } from 'prismic-dom';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  navigation: {
    prevPost: {
      uid: string
      data: {
        title: string
      }
    }[]
    nextPost: {
      uid: string
      data: {
        title: string
      }
    }[]
  }
}

export default function Post({ post, navigation, preview }: PostProps) {
  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading ? contentItem.heading?.split(' ').length : 0;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));

    return total;
  }, 0);

  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }
  return (
    <>
      <Head>
        <title>{post.data.title}</title>
      </Head>
      <img src={post.data.banner.url} alt="Banner" className={styles.banner} />
      <main className={commonStyles.container}>
        <article className={styles.content}>
          <div className={styles.head}>
            <h1>{post.data.title}</h1>
            <div className={styles.info}>
              <div>
                <img src="/images/calendar.svg" alt="Calendar" />
                <time>
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
              </div>

              <div>
                <img src="/images/user.svg" alt="User" />
                {post.data.author}
              </div>

              <div>
                <img src="/images/clock.svg" alt="CLock" />
                {Math.ceil(totalWords / 200)} min
              </div>
            </div>

            {
              post.first_publication_date !== post.last_publication_date &&
              <p>* editado em {
                format(
                  new Date(post.last_publication_date),
                  'dd MMM yyyy, às H:mm',
                  {
                    locale: ptBR,
                  }
                )
              }</p>
            }

          </div>
          {post.data.content.map(item => {
            let cont = 0;
            return (
              <div key={item.heading}>
                <h3>{item.heading}</h3>
                <section
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(item.body)
                  }}
                />
              </div>
            );
          })}
        </article>
        <footer className={styles.footerContent}>
          <aside className={styles.postNavigation}>
            {
              navigation.nextPost[0] &&
              <div className={styles.navigationNext}>
                <h4>{navigation.nextPost[0].data.title}</h4>
                <Link href={`/post/${navigation.nextPost[0].uid}`}>
                  <a>Próximo post</a>
                </Link>
              </div>
            }
            {
              navigation.prevPost[0] &&
              <div className={styles.navigationPrev}>
                <h4>{navigation.prevPost[0].data.title}</h4>
                <Link href={`/post/${navigation.prevPost[0].uid}`}>
                  <a>Post anterior</a>
                </Link>
              </div>
            }
          </aside>
          <Comments />
          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a className={commonStyles.exitPreview}>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </footer>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);
  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]'
    }
  )
  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]'
    }
  )

  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    uid: response.uid,

    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };
  return {
    props: {
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results
      },
      preview,
    },
    revalidate: 60 * 60 * 24
  };
};
