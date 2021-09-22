import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Head from 'next/head';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Post {
  first_publication_date: string | null;
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
  preview: boolean
}

export default function Post({ post, preview }: PostProps) {
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
          </div>
          {post.data.content.map(item => (
            <div key={item.heading}>
              <h3>{item.heading}</h3>
              <section>
                {item.body.map(bodyItem => (
                  <p key={bodyItem.text.split('.')[0]}>{bodyItem.text}</p>
                ))}
              </section>
            </div>
          ))}
        </article>
        <footer className={styles.footerContent}>

          {
            preview && (
              <aside>
                <Link href="/api/exit-preview">
                  <a className={commonStyles.exitPreview}>Sair do modo Preview</a>
                </Link>
              </aside>
            )
          }
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
  previewData
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const post = {
    first_publication_date: response.first_publication_date,
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
      preview,
    },
  };
};
