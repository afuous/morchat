self.addEventListener("push", function(event) {
    if (event.data) {
        let promise = self.registration.showNotification(event.data.text(), {
            badge: "/images/morchat-icon.png",
            icon: "/images/morchat-icon.png",
            silent: true,
            tag: "tag", // keep this constant
        });
        event.waitUntil(promise);
    }
});
