"use strict";

export var notify = function (title: string, message: string) {
    if ('Notification' in window) {
        var options = {
            body: message,
            tag: "custom"
        };
        window.Notification.requestPermission(() => {
            var notification = new window.Notification(this.title, options);
        });
    }
}
