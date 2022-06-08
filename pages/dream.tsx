import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import styles from '../styles/dream/Dream.module.scss';
import { useColyseus } from '../hooks/useColyseus';
import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Navigator } from 'webxr';
import { useDeviceCheck } from '../hooks/useDeviceCheck';
import { Loader } from '../components/experience/loader/loader';
import { Header } from '../components/core/headers/basicHeader/basicHeader';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';
import { useClient } from 'react-supabase';

const Canvas = dynamic(() => import('../components/experience/canvas/canvas'), {
  ssr: false,
});

const Dream: NextPage = () => {
  const { isInVR } = useDeviceCheck();
  const { room } = useColyseus();
  const [webXRIsSupported, setWebXRIsSupported] = useState<boolean>();
  const subdomain: string = 'demo';
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [characterIsCreated, setCharacterIsCreated] = useState<boolean>(false);
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const { session, user } = useAuth();
  const client = useClient();

  useEffect(() => {
    const webXRNavigator: Navigator = navigator as any as Navigator;

    if ('xr' in webXRNavigator) {
      webXRNavigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        setWebXRIsSupported(supported);
      });
    }
  }, [isInVR]);

  useEffect(() => {
    getUserProfile();
    window.addEventListener('message', subscribe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  return (
    <div className={styles.container}>
      <Head>
        <title>CORITA&apos;S DREAM</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {session ? (
        renderContent()
      ) : (
        <>
          <Link href={'/signin'}>
            <a>Log in a mattie :p</a>
          </Link>
        </>
      )}
    </div>
  );

  function renderContent() {
    if (!characterIsCreated) {
      return (
        <>
          <Header showLogo={true} />
          <div className={styles.iframeWrapper}>
            <iframe
              ref={iframeRef}
              id="frame"
              className={styles.iframe}
              src={`https://${subdomain}.readyplayer.me/avatar?frameApi`}
              allow="camera *; microphone *"
            ></iframe>
          </div>
        </>
      );
    } else {
      return renderCanvas();
    }
  }

  function renderCanvas() {
    if (!room) {
      return null;
    }

    return (
      <Suspense fallback={<Loader />}>
        <Canvas isWebXrSupported={webXRIsSupported ?? false} room={room} />
      </Suspense>
    );
  }

  async function subscribe(event: any) {
    const json = parse(event);

    if (json?.source !== 'readyplayerme') {
      return;
    }

    // Susbribe to all events sent from Ready Player Me once frame is ready
    if (
      iframeRef.current &&
      iframeRef.current.contentWindow &&
      json.eventName === 'v1.frame.ready'
    ) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          target: 'readyplayerme',
          type: 'subscribe',
          eventName: 'v1.**',
        }),
        '*'
      );
    }

    // Get avatar GLB URL
    if (json.eventName === 'v1.avatar.exported') {
      if (iframeRef.current) {
        iframeRef.current.hidden = true;
      }

      await updateUserAvatar(json.data.url);
    }

    // Get user id
    if (json.eventName === 'v1.user.set') {
      // console.log(`User with id ${json.data.id} set: ${JSON.stringify(json)}`);
    }
  }

  function parse(event: MessageEvent) {
    try {
      return JSON.parse(event.data);
    } catch (error) {
      return null;
    }
  }

  async function getUserProfile() {
    if (user) {
      const { data: profile } = await client
        .from('profiles')
        .select('id')
        .eq('id', user.id);

      if (!profile || profile?.length === 0) {
        setHasProfile(false);
      } else {
        setHasProfile(true);
        setCharacterIsCreated(true);
      }
    }
  }

  async function updateUserAvatar(url: string) {
    const user = client.auth.user();
    if (user) {
      if (!hasProfile) {
        const { data, error } = await client.from('profiles').insert([
          {
            id: user.id,
            avatar: url,
          },
        ]);

        if (error) {
          console.log(error);
          return;
        }

        if (data) {
          setCharacterIsCreated(true);
        }

        return;
      }
    }
  }
};

export default Dream;
