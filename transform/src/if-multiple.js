function main(a) {
    if (a > 2) {
        foo();
   }
   // some other code
   if (a > 2) {
       bar();
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