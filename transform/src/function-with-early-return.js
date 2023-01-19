main();

function main() {
    console.log("Hello!")

    return;

    shouldNotBeCalled();
}

function shouldNotBeCalled() {
    console.log("I'm called, but I shouldn't!");
}
