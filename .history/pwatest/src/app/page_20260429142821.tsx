"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { subscribeUser, unsubscribeUser, sendNotification } from "./actions";
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    const sub = await registration.pushManager.getSubscription();
    setSubscription(sub);
  }

  async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      ),
    });
    setSubscription(sub);
    const serializedSub = JSON.parse(JSON.stringify(sub));
    await subscribeUser(serializedSub);
  }

  async function unsubscribeFromPush() {
    await subscription?.unsubscribe();
    setSubscription(null);
    await unsubscribeUser();
  }

  async function sendTestNotification() {
    if (subscription) {
      // 중요: subscription 객체를 순수 JSON 데이터로 변환합니다.
      const serializedSub = JSON.parse(JSON.stringify(subscription));
      // 변환된 데이터를 서버 액션으로 보냅니다.
      await sendNotification(message, serializedSub);
      // await sendNotification(message, subscription);
      setMessage("");
    }
  }

  if (!isSupported) {
    return <p>Push notifications are not supported in this browser.</p>;
  }

  return (
    <div>
      <h3>Push Notifications</h3>
      {subscription ? (
        <>
          <p>You are subscribed to push notifications.</p>
          <button
            className="cursor-pointer border-2 border-black"
            onClick={unsubscribeFromPush}
          >
            Unsubscribe
          </button>
          <input
            type="text"
            placeholder="Enter notification message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            className="cursor-pointer border-2 border-black"
            onClick={sendTestNotification}
          >
            Send Test
          </button>
        </>
      ) : (
        <>
          <p>You are not subscribed to push notifications.</p>
          <button
            className="cursor-pointer border-2 border-black"
            onClick={subscribeToPush}
          >
            Subscribe
          </button>
        </>
      )}
    </div>
  );
}

// function InstallPrompt() {
//   const [isIOS, setIsIOS] = useState(false);
//   const [isStandalone, setIsStandalone] = useState(false);
//   const [deferredPrompt, setDeferredPrompt] =
//     useState<BeforeInstallPromptEvent | null>(null);
//   function installPWA() {
//     if (deferredPrompt) {
//       alert("설치가 돼요");
//       deferredPrompt?.prompt();
//     } else {
//       alert("설치가 안돼요.");
//     }
//   }

//   useEffect(() => {
//     window.addEventListener("beforeinstallprompt", (event) => {
//       event.preventDefault();
//       setDeferredPrompt(event as BeforeInstallPromptEvent);
//     });
//     setIsIOS(
//       /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream,
//     );

//     setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
//   }, []);

//   if (isStandalone) {
//     return null; // Don't show install button if already installed
//   }

//   return (
//     <div>
//       <h3 className="text-2xl">Install App</h3>
//       <button
//         className="text-[20px] w-fit pt-1.5 cursor-pointer border-2 border-gray-500"
//         onClick={() => installPWA()}
//       >
//         Add to Home Screen
//       </button>
//       {isIOS && (
//         <p>
//           To install this app on your iOS device, tap the share button
//           <span role="img" aria-label="share icon">
//             {" "}
//             ⎋{" "}
//           </span>
//           and then "Add to Home Screen"
//           <span role="img" aria-label="plus icon">
//             {" "}
//             ➕{" "}
//           </span>
//           .
//         </p>
//       )}
//     </div>
//   );
// }

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <PushNotificationManager />
        <InstallPrompt />
        <div>
          <p>왜안대!</p>
        </div>
        <div>
          <h1 className="text-[40px]">이건 뭘까요?</h1>
          <button
            className="text-[20px] border-2 border-black rounded-sm cursor-pointer"
            onClick={() => {
              const result = window.prompt("된다", "");
              if (result != null) alert(result);
            }}
          >
            된다 얍!
          </button>
        </div>
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
