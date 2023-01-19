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
    let i = 0;
    while(i < 2) {
        i++;
        askQuestion();
    }
}

function askQuestion() {
    console.log("What's your name?");
}

function main() {
    hello();
}

main();
