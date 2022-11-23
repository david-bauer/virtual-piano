class Key {
    constructor(key) {
        this.key = key;

        this.elem = document.createElement('kbd');
        this.elem.classList.add('key');
        this.elem.innerText = key.toUpperCase();
        this.isUp = true;
    }

    sound() {
        // returns an audio object of the sound produced by the key
        // the sound for key 'a' should be saved as: '/sounds/a.mp3'
        let soundPath = 'sounds/';
        soundPath += this.key.toUpperCase() + '.mp3';
        return new Audio(soundPath);
    }

    play() {
        // don't play another sound if the key bound to this note hasn't been released
        // prevents the browser from spamming the sound when the key bound to this note is held down
        if (!this.isUp) {
            return;
        }
        this.isUp = false;

        try {
            // load the sound associated with this key
            const note = this.sound();
            // play the sound as soon as it loads
            async function playSound(event) {
                await event.target.play();
                this.elem.setAttribute('aria-pressed', 'true');
            }
            note.addEventListener('canplaythrough', playSound.bind(this));
            note.addEventListener('pause', this.pause.bind(this));
        }
        catch(err) {
            const message = `Could not play '${this.key}': \` + ${err}`;
            this.elem.classList.add('error');
            this.elem.innerText = message;
            console.error(message);
        }
    }


    pause() {
        this.isUp = true;
        // lift the button on the screen
        this.elem.setAttribute('aria-pressed', 'false');
    }
}


class WhiteKey extends Key {
    constructor(key) {
        super(key);
        this.elem.classList.add('white-key');
        this.type = 'white';
    }
}

class BlackKey extends Key {
    constructor(key) {
        super(key);
        this.elem.classList.add('black-key');
        this.type = 'black';
    }
}


class Piano {
    constructor() {
        function createDiv(className) {
            const newDiv = document.createElement('div');
            newDiv.classList.add(className);
            return newDiv;
        }
        this.elem = createDiv('piano');
        const whiteKeyContainer = createDiv('white-keys');
        const blackKeyContainer = createDiv('black-keys');
        this.elem.appendChild(whiteKeyContainer);
        this.elem.appendChild(blackKeyContainer);

        this.keys = {};
        document.addEventListener('keydown', this.playEvent.bind(this));
        document.addEventListener('click', this.playEvent.bind(this));
        document.addEventListener('keyup', this.stopEvent.bind(this));
    }


    validate() {
        // count white and black keys currently in the piano
        const [whiteKeys, blackKeys] = Object.values(this.keys).reduce(function (accumulator, key) {
            return [accumulator[0] + (key.type === 'white'), accumulator[1] + (key.type === 'black')];
        }, [0, 0]);

        // for the css to display correctly, there needs to be 5 or less black keys for every 7 white keys
        const ratioValid = (Math.floor(whiteKeys * 5 / 7) >= blackKeys);
        if (!ratioValid) {
            console.warn('There are too many black keys! The page will not display correctly until more white keys are added.');
        }

        // check that all keys have audio files
        const audioValid = Object.values(this.keys).every(key => {
            const sound = key.sound();
            return (sound.error === null);
        });
        if (!audioValid) {
            console.warn('Some keys are missing audio files!');
        }

        return (ratioValid && audioValid);
    }


    createKeys(keyList, keyType) {
        // append new keys to the dictionary of keys
        this.keys = {...this.keys, ...Object.fromEntries(keyList.map(key => {
            const newKey = new keyType(key);
            // put the key in the correct container (for styling)
            if (keyType === WhiteKey) {
                this.elem.firstElementChild.appendChild(newKey.elem);
            } else if (keyType === BlackKey){
                this.elem.lastElementChild.appendChild(newKey.elem);
            }
            return [key, newKey];
        }))};

        // update the css property
        this.elem.style.setProperty('--num-keys', this.elem.firstElementChild.childElementCount.toString());
    }


    playEvent(event) {
        let keyPressed = '';
        if (event.type === 'keydown') {
            keyPressed = event.key.toLowerCase();
        } else if (event.type === 'click') {
            keyPressed = event.target.innerText.toLowerCase();
        }
        //compare the pressed key to the list of valid keys
        if ( keyPressed in this.keys ) {
            this.keys[keyPressed].play();
        }
    }

    stopEvent(event) {
        const keyPressed = event.key.toLowerCase();
        if ( keyPressed in this.keys ) {
            this.keys[keyPressed].pause();
        }
    }
}

const piano = new Piano();
piano.createKeys(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'], WhiteKey);
piano.createKeys(['w', 'e', 't', 'y', 'u', 'i', 'o'], BlackKey);
piano.validate();
document.body.appendChild(piano.elem);