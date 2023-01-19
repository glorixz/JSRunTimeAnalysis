function hello() {
    let i = 0;
    while(i < 10) {
      const c = i;
      i++
      sayHello();
    }
}

function sayHello() {
    console.log("Hello!")
}

function main() {
    hello();
}

main();
