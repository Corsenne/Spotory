import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { DownloadCloud, RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

type UpdateContextValue = {
  checking: boolean;
  message: string;
  checkForUpdate: () => Promise<void>;
};

const UpdateContext = createContext<UpdateContextValue | null>(null);

export function PwaUpdateProvider({ children }: { children: ReactNode }) {
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState('自動更新は有効です');
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW: (_url, nextRegistration) => {
      registration.current = nextRegistration ?? null;
    },
    onRegisterError: () => setMessage('更新機能を開始できませんでした'),
  });

  async function checkForUpdate() {
    if (!('serviceWorker' in navigator)) {
      setMessage('このブラウザは自動更新に対応していません');
      return;
    }
    setChecking(true);
    setMessage('最新版を確認しています…');
    try {
      const current = registration.current ?? await navigator.serviceWorker.ready;
      registration.current = current;
      await current.update();
      const worker = current.installing;
      if (current.waiting || needRefresh) {
        setMessage('最新版を反映しています…');
        await updateServiceWorker(true);
        return;
      }
      if (!worker) {
        setMessage('現在のバージョンが最新版です');
        return;
      }
      setMessage('最新版をダウンロードしています…');
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && current.waiting) {
          setMessage('最新版を反映しています…');
          void updateServiceWorker(true);
        } else if (worker.state === 'activated') {
          location.reload();
        }
      });
    } catch {
      setMessage('更新を確認できませんでした。通信状態をご確認ください');
    } finally {
      setChecking(false);
    }
  }

  return <UpdateContext.Provider value={{ checking, message, checkForUpdate }}>
    {children}
    {needRefresh && <div className="update">新しいバージョンがあります<button onClick={() => void updateServiceWorker(true)}>更新</button><button onClick={() => setNeedRefresh(false)}>後で</button></div>}
  </UpdateContext.Provider>;
}

export function PwaUpdateSettings() {
  const update = useContext(UpdateContext);
  if (!update) return null;
  return <section className="pwa-update-card">
    <div><DownloadCloud/><span><b>アプリの更新</b><small>{update.message}</small></span></div>
    <button type="button" className="secondary" disabled={update.checking} onClick={() => void update.checkForUpdate()}>
      <RefreshCw className={update.checking ? 'spinning' : ''}/>{update.checking ? '確認中…' : '最新版を確認'}
    </button>
  </section>;
}
