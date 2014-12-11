"use strict";
require("Multivalue").converters.register();
var EventEmitter = require("modules/events/eventEmitter");
var utils = require("./utils");

var chai = require('chai');
var expect = chai.expect;

describe("Test Tlgr by using it as chat", function() {
    this.timeout(20000);

    describe("Basic", function() {
        before(function(done) {
            var conn = this.connection = new utils.Connection();

            var da = this.dumbledoresArmy = Object.create(null);

            da.harryPotter = new utils.Actor("Harry", conn.createTlgr());
            da.hermioneGranger = new utils.Actor("Hermione", conn.createTlgr());
            da.ronandWeasley = new utils.Actor("Ron", conn.createTlgr());
            da.nevilleLongbottom = new utils.Actor("Neville", conn.createTlgr());
            da.lunaLovegood = new utils.Actor("Luna", conn.createTlgr());
            da.ginevraWeasley = new utils.Actor("Ginny", conn.createTlgr());
            da.georgeWeasley = new utils.Actor("Fred", conn.createTlgr());
            da.fredWeasley = new utils.Actor("George", conn.createTlgr());

            da.hermioneGranger.startChat();
            da.harryPotter.joinChat(da.hermioneGranger.generateInvitation());
            da.ronandWeasley.joinChat(da.hermioneGranger.generateInvitation());
            da.nevilleLongbottom.joinChat(da.harryPotter.generateInvitation());
            da.ginevraWeasley.joinChat(da.ronandWeasley.generateInvitation());
            da.georgeWeasley.joinChat(da.hermioneGranger.generateInvitation());
            da.fredWeasley.joinChat(da.georgeWeasley.generateInvitation());

            done();
        });

        it("can send messages", function() {
            var da = this.dumbledoresArmy;


            for (var actor in da) {
                expect(actor.group).to.be.deep.equal(da.harryPotter.group);
            }

            var expectedGroup = {
                "Harry": true,
                "Hermione": true,
                "Ron": true,
                "Neville": true,
                "Luna": true,
                "Ginny": true,
                "Fred": true,
                "George": true,
            };
            var actualGroup = {};
            for (var name in da.harryPotter.group) {
                actualGroup[name] = true;
            }

            expect(actualGroup).to.be.deep.equal(expectedGroup);

            var conversation = [{
                actor: da.harryPotter,
                text: "Hi all!"
            }, {
                actor: da.georgeWeasley,
                text: "Hello, Harry!"
            }, {
                actor: da.ginevraWeasley,
                text: "Hi, Harry!"
            }, {
                actor: da.nevilleLongbottom,
                text: "Hi, Harry!"
            }, {
                actor: da.fredWeasley,
                text: "Salute, Harry!"
            }, {
                actor: da.hermioneGranger,
                text: "Yes, hi, Harry."
            }, {
                actor: da.hermioneGranger,
                text: "So, as you all know, we are using here a special kind of magic!"
            }, {
                actor:da.ronandWeasley,
                text: "Yeah... Cryptomagic... My father told me about this muggle thing once."
            }];

            conversation.forEach(function (entry) {
                entry.actor.sendMessage(entry.text);
            });

            for (actor in da) {
                expect(actor.history).to.be.deep.equal(da.harryPotter.history);
            }

            expect(da.harryPotter.history.map(function (message) {
                return {
                    sender: message.sender.name,
                    test: message.text
                }
            })).to.be.deep.equal(conversation.map(function (entry) {
                return {
                    sender: entry.actor.name,
                    test: entry.text
                }
            }));
        });
    });
});