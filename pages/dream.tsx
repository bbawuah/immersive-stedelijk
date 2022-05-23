import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import styles from '../styles/dream/Dream.module.scss';
import { useColyseus } from '../hooks/useColyseus';
import { Suspense, useEffect, useRef, useState } from 'react';
import type { Navigator } from 'webxr';
import { useDeviceCheck } from '../hooks/useDeviceCheck';
import { Loader } from '../components/experience/loader/loader';
import { client as supabaseClient } from '../utils/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Header } from '../components/core/headers/basicHeader/basicHeader';
import { useAuth } from '../hooks/useAuth';
import Router from 'next/router';

const Canvas = dynamic(() => import('../components/experience/canvas/canvas'), {
  ssr: false,
});

const Dream: NextPage = () => {
  const { isInVR } = useDeviceCheck();
  const { client, id, room } = useColyseus();
  const [webXRIsSupported, setWebXRIsSupported] = useState<boolean>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const subdomain: string = 'demo';
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [charachterIsCreated, setCharachterIsCreated] =
    useState<boolean>(false);
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>(
    supabaseClient.auth.session()
  );

  useEffect(() => {
    const webXRNavigator: Navigator = navigator as any as Navigator;

    if ('xr' in webXRNavigator) {
      webXRNavigator.xr.isSessionSupported('immersive-vr').then((supported) => {
        setWebXRIsSupported(supported);
      });
    }
  }, [isInVR]);

  useEffect(() => {
    const currentSession = supabaseClient.auth.session();

    setSession(currentSession);

    console.log(currentSession);

    if (!currentSession) {
      // Router.push('/');
    }

    if (room) {
      console.log('room is available');
    }

    getUserProfile();
    window.addEventListener('message', subscribe);
    document.addEventListener('message', subscribe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.container}>
      {session && (
        <>
          <Head>
            <title>CORITA&apos;S DREAM</title>
            <meta name="description" content="Generated by create next app" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          {renderContent()}
        </>
      )}
    </div>
  );

  function renderContent() {
    if (!charachterIsCreated) {
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
    if (!client || !id || !room) {
      return null;
    }

    return (
      <Suspense fallback={<Loader />}>
        <Canvas
          isWebXrSupported={webXRIsSupported ?? false}
          client={client}
          id={id}
          room={room}
        />
      </Suspense>
    );
  }

  function subscribe(event: any) {
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
      console.log(`Avatar URL: ${json.data.url}`);

      if (iframeRef.current) {
        iframeRef.current.hidden = true;
      }

      updateUserAvatar(json.data.url);
    }

    // Get user id
    if (json.eventName === 'v1.user.set') {
      console.log(`User with id ${json.data.id} set: ${JSON.stringify(json)}`);
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
    const user = supabaseClient.auth.user();
    if (user) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('id', user.id);

      if (!profile || profile?.length === 0) {
        console.log(profile);
        setHasProfile(false);
      } else {
        setHasProfile(true);
        setCharachterIsCreated(true);
      }
    }
  }

  async function updateUserAvatar(url: string) {
    const user = supabaseClient.auth.user();

    if (user) {
      if (!hasProfile) {
        const { data, error } = await supabaseClient
          .from('profiles')
          .insert([{ id: user?.id, updated_at: new Date(), avatar: url }]);

        if (error) {
          console.log(error.message);
        }

        if (data) {
          setCharachterIsCreated(true);
        }
      } else {
        setCharachterIsCreated(true);
      }
    }
  }
};

export default Dream;
