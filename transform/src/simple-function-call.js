function hello() {
    let i = 0;
    while(i < 1000000000) {
      const c = i;
      i++
    }
}

function main() {
    hello();
}

main();
