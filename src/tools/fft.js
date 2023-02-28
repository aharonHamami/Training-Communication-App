import { create, all } from 'mathjs'

const config = { }
const math = create(all, config)

function multiply(...args) {
    let m = 1;
    for(const arg in args) {
        m = math.multiply(m, arg);
    }
    return m;
}

// signal should be an array of numbers between -1 and 1.
export const dft = async (signal) => {
    console.log('start calculating dft');
    const X = []; // dft per frequency
    const N = signal.length;
    
    // calculate the center of mass for each frequency (k)
    for(let k=0; k<N; k++) {
        
        let Xk = 0;
        for(const n in signal) {
            // e^(-i2πkn/N)
            const primitiveRoot = math.pow(math.e, multiply(math.i, -2, math.pi, k, math.divide(n, N)));
            const amptitude = signal[n];
            Xk += math.multiply(amptitude, primitiveRoot);
        }
        
        console.log('Xk = ', Xk);
        X.push(Xk);
    }
    
    return X;
}