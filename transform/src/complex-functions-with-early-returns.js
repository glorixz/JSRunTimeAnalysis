main();
shouldNotBeCalled();
makeBreakfast();
shouldNotBeCalled();

function main() {
    for(let i = 0; i < 10; i++) {
        let remark = waveHello();
        console.log(remark);
        
        let c = i - 2;
        while (c !== i) {
            let end = waveGoodbye();
            console.log(end);
            c++;
            return;
        }

        shouldNotBeCalled();
    }
}

function makeBreakfast() {
    let c = 10;

    for (let i = 0; i < c; i++) {
        if (c == i) {
            return "eggs benedict"
        } else {
            return "scrambled eggs";
        }
    }
}

function shouldNotBeCalled() {
    console.log("I should't be here!");
}

function waveHello() {
    for(let i = 0; i < 1000; i++) {
        // pausing...
    }

    return "hello!";
}

function waveGoodbye() {
    for (let i = 0; i < 500; i++) {
        // pausing...
    }

    return "goodbye!";
}
