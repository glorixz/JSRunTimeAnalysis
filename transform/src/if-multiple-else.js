function main(a) {
    if (a < 2) {
        foo();
    } else {
        bar();
    }
    // some other code
    if (a == 2) {
        bar();
    } else if (a == 3) {
        foo();
    }
}
function foo() {
    console.log('food')
    bar();
}

function bar() {
    console.log('bar')
}
main(3);