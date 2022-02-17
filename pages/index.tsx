import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { Controls } from '../components/webgl/controls/controls';
import { ClientType } from '../types/socket';
import styles from '../styles/Home.module.scss';
import { useColyseus } from '../hooks/useColyseus';

const Canvas = dynamic(() => import('../components/webgl/canvas/canvas'));

const Home: NextPage = () => {
  const { client, room } = useColyseus();

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {renderPage()}
    </div>
  );

  function renderPage() {
    // if (!) {
    //   return null;
    // }

    return <Canvas />;
  }
};

export default Home;
