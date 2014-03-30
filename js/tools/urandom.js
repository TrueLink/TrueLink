define([], function () {
    "use strict";
    function randomInt(min, max) {
        min = (!min && min !== 0) ? -0x7FFFFFFF : min;
        max = (!max && max !== 0) ? 0x7FFFFFFF : max;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    var names = ["James", "Christopher", "Ronald", "Mary", "Lisa", "Michelle", "John", "Daniel", "Anthony", "Patricia", "Nancy", "Laura", "Robert", "Paul", "Kevin", "Linda", "Karen", "Sarah", "Michael", "Mark", "Jason", "Barbara", "Betty", "Kimberly", "William", "Donald", "Jeff", "Elizabeth", "Helen", "Deborah", "David", "George", "Jennifer", "Sandra", "Richard", "Kenneth", "Maria", "Donna", "Charles", "Steven", "Susan", "Carol", "Joseph", "Edward", "Margaret", "Ruth", "Thomas", "Brian", "Dorothy", "Sharon"];
    var surnames = ["Smith", "Anderson", "Clark", "Wright", "Mitchell", "Johnson", "Thomas", "Rodriguez", "Lopez", "Perez", "Williams", "Jackson", "Lewis", "Hill", "Roberts", "Jones", "White", "Lee", "Scott", "Turner", "Brown", "Harris", "Walker", "Green", "Phillips", "Davis", "Martin", "Hall", "Adams", "Campbell", "Miller", "Thompson", "Allen", "Baker", "Parker", "Wilson", "Garcia", "Young", "Gonzalez", "Evans", "Moore", "Martinez", "Hernandez", "Nelson", "Edwards", "Taylor", "Robinson", "King", "Carter", "Collins"];
    var colors = ["White", "Silver", "Gray", "Black", "Red", "Maroon", "Yellow", "Olive", "Lime", "Green", "Aqua", "Teal", "Blue", "Navy", "Fuchsia", "Purple"];
    var animals = ["Wolf", "Tiger", "Fox", "Bear", "Panther", "Panda", "Jaguar", "Dolphin", "Dog", "Otter", "Owl", "Koala", "Puma", "Cat", "Seal", "Bunny", "Kangaroo", "Giraffe", "Horse", "Eagle", "Rabbit", "Turtle", "Deer", "Coyote", "Whale", "Zebra", "Chipmunk", "Chinchilla", "Squirrel", "Hedgehog", "Ferret", "Raccoon", "Hippopotamus", "Hamster", "Wombat", "Salamander", "Opossum"];
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
    var answers = ["Not bad.", "He's doing well.", "Great!", "Fantastic!", "Wonderful!", "He can't complain.", "He's fine, thank you.", "Doing fine. And you?", "Couldn't be better.", "Lovin' life.", "He's life's great.", "Alright.", "Been better.", "Just fine, thanks.", "It's Monday.", "It's Friday!", "He's doing great!", "He's doing lousy - he's up to his eyeballs in work.", "So-so", "Hangin' in there."];

    function randomItem(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    return {
        // including
        int: randomInt,
        string: function (length) {
            if (!length) {
                length = Math.floor(Math.random() * chars.length);
            }
            var str = '', i;
            for (i = 0; i < length; i++) {
                str += randomItem(chars);
            }
            return str;
        },
        bytes: function (count) {
            var b = [], i;
            for (i = 0; i < count; i++) {
                b.push(Math.floor(Math.random() * 255));
            }
            return b;
        },
        name: function () {
            var name = randomItem(names);
            var surname = randomItem(surnames);
            return name + " " + surname;
        },
        animal: function () {
            var color = randomItem(colors);
            var animal = randomItem(animals);
            return color + " " + animal;
        },
        answer: function () {
            return randomItem(answers);
        }
    };
});