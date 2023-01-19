main()

function main() {
    for (let i = 0; i < 10; i++) {
        console.log("Make request?");
        
        let c = 0;
        while (c !== 2) {
            request();
            c++;
        }
    }

}
function request() {
    for (let v = 0; v < 100000; v++) {
        let c = v;
    }
}