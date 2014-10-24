"use strict";
import Profile = require("models/Profile");

export var notify = function (title: string, message: string) {
    if ('Notification' in window) {
        var options = {
            body: message,
            tag: "custom",
            icon: 'favicon.ico'
        };
        window.Notification.requestPermission(() => {
            var notification = new window.Notification(title, options);
        });
    }
}

export var playMessageArrivedSound = function (profile: Profile.Profile) {
    if (profile.notificationSound === "disabled") {
        return;
    }
    if (profile.notificationSound === "audiotag1") {
        (<any>document.getElementById("audiotag1")).play();
    }
}
