import { Wallet } from './interfaces'
import { cry } from 'thor-devkit'

/** class simply implements Wallet interface */
export class SimpleWallet implements Wallet {
    private readonly keys = [] as KeyEntity[]

    get list() {
        return this.keys.map(k => {
            return {
                address: k.address,
                sign(msgHash: Buffer) {
                    return cry.secp256k1.sign(msgHash, k.privateKey)
                }
            }
        })
    }

    /**
     * import private key
     * @param privateKey hex string presented private key
     * @returns address derived from the private key
     */
    public import(privateKey: string) {
        if (privateKey.startsWith('0x')) {
            privateKey = privateKey.slice(2)
        }
        if (!/^[0-9a-f]{64}$/i.test(privateKey)) {
            throw new Error('invalid private key')
        }
        const buf = Buffer.from(privateKey, 'hex')
        const addr = '0x' + cry.publicKeyToAddress(cry.secp256k1.derivePublicKey(buf)).toString('hex')
        this.keys.push({ address: addr, privateKey: buf })
        return addr
    }

    /**
     * remove corresponding key by given address
     * @param addr address
     * @returns true if found and removed, false otherwise
     */
    public remove(addr: string) {
        const i = this.keys.findIndex(k => k.address === addr.toLowerCase())
        if (i >= 0) {
            this.keys.splice(i, 1)
            return true
        }
        return false
    }
}

interface KeyEntity {
    privateKey: Buffer
    address: string
}
