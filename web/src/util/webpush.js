import config from "~/config.json";
import { request } from "~/util/ajax";

export const hasWebPush = ("serviceWorker" in navigator) && ("PushManager" in window);

let registration = null;

export async function loadWorker() {
    if (hasWebPush) {
        registration = await navigator.serviceWorker.register("/service-worker.js");
    }
}

export async function getSubscription() {
    if (registration) {
        return await registration.pushManager.getSubscription();
    }
}

export async function subscribe() {
    if (!registration) {
        throw "No service worker registration";
    }

    if (await getSubscription()) {
        return;
    }

    let subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: config.webPushPublicKey,
    });
    await request("POST", "/addWebPushSubscription", {
        webPushSubscriptionStr: JSON.stringify(subscription),
    });
}

export async function unsubscribe() {
    if (!registration) {
        throw "No service worker registration";
    }

    let subscription = await getSubscription();
    if (!subscription) {
        return;
    }
    await request("POST", "/removeWebPushSubscription", {
        webPushSubscriptionStr: JSON.stringify(subscription),
    });
    subscription.unsubscribe();
}
