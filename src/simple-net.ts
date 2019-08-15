import { Net } from './interfaces'
import Axios, { AxiosInstance, AxiosError } from 'axios'
import { SimpleWebSocketReader } from './simple-websocket-reader'
import { resolve } from 'url'

/** class simply implements Net interface */
export class SimpleNet implements Net {
    private readonly axios: AxiosInstance

    constructor(
        readonly baseURL: string,
        timeout = 15 * 1000,
        private readonly wsTimeout = 30 * 1000
    ) {
        this.axios = Axios.create({
            baseURL,
            timeout
        })
    }

    public async http(
        method: 'GET' | 'POST',
        path: string,
        params?: Net.Params): Promise<any> {
        params = params || {}
        try {
            const resp = await this.axios.request({
                method,
                url: path,
                data: params.body ? JSON.stringify(params.body) : undefined,
                headers: params.headers,
                params: params.query
            })
            if (params.validateResponseHeader) {
                params.validateResponseHeader(resp.headers)
            }
            return resp.data
        } catch (err) {
            if (err.isAxiosError) {
                throw convertError(err)
            }
            throw new Error(`${method} ${resolve(this.baseURL, path)}: ${err.message}`)
        }
    }
    public openWebSocketReader(path: string) {
        const url = resolve(this.baseURL, path)
            .replace(/^http:/i, 'ws:')
            .replace(/^https:/i, 'wss:')
        return new SimpleWebSocketReader(url, this.wsTimeout)
    }
}

function convertError(err: AxiosError) {
    if (err.response) {
        const resp = err.response
        if (typeof resp.data === 'string') {
            let text = resp.data.trim()
            if (text.length > 50) {
                text = text.slice(0, 50) + '...'
            }
            return new Error(`${resp.status} ${err.config.method} ${err.config.url}: ${text}`)
        } else {
            return new Error(`${resp.status} ${err.config.method} ${err.config.url}`)
        }
    } else {
        return new Error(`${err.config.method} ${err.config.url}: ${err.message}`)
    }
}
