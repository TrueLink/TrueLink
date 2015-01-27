require('colors')
selenium = require('selenium-standalone')
wd = require('wd')
Q = require('q')

pick = (array) ->
    return array[Math.floor(Math.random() * array.length)]

class User
    constructor: (@username, @slaves_count) ->

    _makeBrowser: (name) ->
        browser = wd.promiseChainRemote()

        browser.on 'status', (info) ->
            console.log(info.cyan)

        browser.on 'command', (eventType, command, response) ->
            console.log(name + ' > ' + eventType.cyan, command, (response || '').grey)

        browser.on 'http', (meth, path, data) ->
            console.log(name + ' > ' + meth.magenta, path, (data || '').grey)

        return browser

    _waitInitialization: (browser) ->
        return browser
            .get("http://127.0.0.1:8010/build/")
            .waitForElementById("app", 120*1000, 1000)

    _syncSlave: (master, slave) ->
        syncOffer = null
        syncAuth = null

        return Q
            .fcall -> 
                return master
                    .waitForElementById("sync-menu-item")
                    .click()
                    .waitForElementById("add-device-button")
                    .click()
                    .waitForElementById("sync-offer-field")
                    .getValue()
                    .then (value) ->
                        syncOffer = value
            .then ->
                return slave
                    .waitForElementById("sync-profile-offer-field")
                    .type(syncOffer)
                    .waitForElementById("sync-profile-accept-offer-button")
                    .click()
            .then ->
                return master
                    .waitForElementById("sync-auth-field", 15*1000)
                    .getValue()
                    .then (value) ->
                        syncAuth = value
            .then ->
                return slave
                    .waitForElementById("sync-profile-auth-field")
                    .type(syncAuth)
                    .waitForElementById("sync-profile-accept-auth-button")
                    .click()

    init: ->
        master = @master = @_makeBrowser(@username + "_master")
        browsers = @browsers = [@master]
        slaves = @slaves = []

        num = 0
        while slaves.length < @slaves_count
            num += 1
            slave = @_makeBrowser(@username + "_slave_" + num)
            @browsers.push(slave)
            @slaves.push(slave)

        start_time = (new Date()).getTime()
        return Q
            .all browsers.map (browser) => 
                browser.init 
                    browserName: 'chrome'
            .then () =>
                return Q
                    .all [
                        @_waitInitialization(master)
                            .waitForElementByCssSelector(".profile-creation-anonymous")
                            .click()
                            .waitForElementByCssSelector(".profile-creation-page form input[type=text]")
                            .type(@username)
                            .waitForElementByCssSelector(".profile-creation-page form input[type=submit]")
                            .click()
                    ].concat @slaves.map (slave) =>
                        @_waitInitialization(slave)
                            .waitForElementById("create-synced-profile-button")
                            .click()
            .then () =>
                console.log("------------------------------------------------------------------------------------", (new Date()).getTime() - start_time)
            .then () =>
                sequence = slaves.map (slave) => 
                    return () => 
                        return @_syncSlave(master, slave)
                return sequence.reduce Q.when, Q(null)

    addContact: (other) ->
        host = pick(@browsers)
        guest = pick(other.browsers)
        contactOffer = null
        contactAuth = null

        return Q
            .fcall =>
                return host
                    .waitForElementById("contacts-menu-item", 3*1000)
                    .click()
                    .waitForElementById("add-contact-button")
                    .click()
                    .waitForElementByCssSelector("*[data-id=contactName] input")
                    .type(other.username)
                    .waitForElementById("generate-offer-button")
                    .click()
                    .waitForElementById("create-contact-offer-field", 3*1000)
                    .getValue()
                    .then (value) =>
                        contactOffer = value
            .then =>
                return guest
                    .waitForElementById("contacts-menu-item", 3*1000)
                    .click()
                    .waitForElementById("add-contact-button")
                    .click()
                    .waitForElementByCssSelector("*[data-id=contactName] input")
                    .type(@username)
                    .waitForElementById("create-contact-offer-field")
                    .type(contactOffer)
                    .waitForElementById("create-contact-accept-offer-button")
                    .click()
            .then =>
                return host
                    .waitForElementById("create-contact-auth-field", 15*1000)
                    .getValue()
                    .then (value) =>
                        contactAuth = value
            .then =>
                return guest
                    .waitForElementById("create-contact-auth-field")
                    .type(contactAuth)
                    .waitForElementById("create-contact-accept-auth-button")
                    .click()

    addToDialog: (chatname, first, other...) ->
        all = @browsers.concat(first.browsers)
        other.map (user) => all.concat(user.browsers)
        host = pick(@browsers)
        return Q
            .fcall =>
                return host
                    .waitForElementById("dialogs-menu-item", 3 * 1000)
                    .click()
                    .sleep(1000)
                    .waitForElementByCssSelector("*[data-name='" + first.username + "']")
                    .click()
                    .waitForElementByCssSelector(".header-dropdown-menu-button button")
                    .click()
                    .waitForElementByCssSelector("#dialog-add-people-button a")
                    .click()
            .then () => 
                sequence = other.map (user) => 
                    return () => 
                        return host
                            .waitForElementByCssSelector("*[data-name='" + user.username + "'] input")
                            .click()
                return sequence.reduce Q.when, Q(null)
            .then () =>
                return host
                    .sleep(1000)
                    .waitForElementByCssSelector("input[type=button][value=Invite]")
                    .click()
            .then () => Q.all other.concat([first]).map (user) =>
                groupChatTempName = null
                return pick(user.browsers)
                    .waitForElementById("dialogs-menu-item", 3 * 1000)
                    .click()
                    .sleep(1000)
                    .waitForElementByCssSelector("*[data-name='" + @username + "']")
                    .click()
                    .waitForElementByCssSelector(".invite-message-accept-button", 15 * 1000)
                    .click()
                    .waitForElementByCssSelector(".invite-message-go-to-chat-button")
                    .click()
                    .waitForElementByCssSelector("[data-id=gcName] button")
                    .click()
                    .waitForElementByCssSelector("[data-id=gcName] input")
                    .getValue()
                    .then (value) =>
                        groupChatTempName = value
                    .then () =>
                        Q.all user.browsers.map (browser) =>
                            return browser
                                .waitForElementById("dialogs-menu-item")
                                .click()
                                .waitForElementByCssSelector("*[data-name='" + groupChatTempName + "']")
                                .click()
                                .waitForElementByCssSelector("[data-id=gcName] button")
                                .click()
                                .waitForElementByCssSelector("[data-id=gcName] input")
                                .type(chatname)

            .then () =>
                groupChatTempName = null
                return host
                    .waitForElementByCssSelector("[data-id=gcName] button")
                    .click()
                    .waitForElementByCssSelector("[data-id=gcName] input")
                    .getValue()
                    .then (value) =>
                        groupChatTempName = value
                    .then () =>
                        Q.all @browsers.map (browser) =>
                            return browser
                                .waitForElementById("dialogs-menu-item")
                                .click()
                                .waitForElementByCssSelector("*[data-name='" + groupChatTempName + "']")
                                .click()
                                .waitForElementByCssSelector("[data-id=gcName] button")
                                .click()
                                .waitForElementByCssSelector("[data-id=gcName] input")
                                .type(chatname)

            .then () =>
                return pick(all)
                    .waitForElementById("dialogs-menu-item")
                    .click()
                    .waitForElementByCssSelector("*[data-name='" + chatname + "']")
                    .click()
                    .waitForElementByCssSelector(".header-dropdown-menu-button button")
                    .click()
                    .waitForElementByCssSelector("#group-chat-rekey-button a")
                    .click()

server = null

user1 = new User("user1", 1)
user2 = new User("user2", 1)
user3 = new User("user3", 1)

Q.nfcall(selenium.start, {})
    .then (s) ->
        server = s
    .then () -> 
        return user1.init()
    .then () -> 
        return user2.init()
    .then () -> 
        return user3.init()
    .then () -> 
        return user1.addContact(user2)
    .then () -> 
        return user3.addContact(user2)
    .then () -> 
        return user2.addToDialog("groupchat1", user3, user1)

    .catch (error) ->
        console.error(error)
    # .fin () ->
    #     return Q
    #         .all [
    #             b1.quit()
    #             b2.quit()
    #         ]
    #         .then () -> server.kill()
