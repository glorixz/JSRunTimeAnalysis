function hello() {
    for (let i = 0; i < 10; i++) {
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
