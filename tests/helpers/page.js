const puppeteer = require('puppeteer')

const sessionFactory = require('../factories/sessionFactory')
const userFactory = require('../factories/userFactory')

class CustomPage {
    static async build() {
        const browser = await puppeteer.launch({
            headless: false
        })

        const page = await browser.newPage()
        const customPage = new CustomPage(page, browser)

        return new Proxy(customPage, {
            get: function (target, property) {
                return customPage[property] || browser[property] || page[property]
            }
        })
    }

    constructor(page, browser) {
        this.page = page
        this.browser = browser
    }

    close() {
        this.browser.close()
    }

    async login() {
        const user = await userFactory()
        const { session, sig } = sessionFactory(user)

        await this.page.setCookie({ name: 'session', value: session })
        await this.page.setCookie({ name: 'session.sig', value: sig })

        await this.page.goto('http://localhost:3000')

        await this.page.waitForSelector('a[href="/auth/logout"]')
    
    }

    async getContentsOf(selector) {
        return await this.page.$eval(selector, el => el.innerHTML)
    }

    get(path) {
        const getBlogs = (_path) => {
            return fetch(_path, {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Content-Type':'application/json'
                }
            }).then(res => res.json())
        }

        return this.page.evaluate(getBlogs, path)
    }

    post(path, data) {
        const createBlog = (_path, _data) => {
            return fetch(_path, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type':'application/json'
                },
                body: JSON.stringify(_data)
            }).then(res => res.json())
        }

        return this.page.evaluate(createBlog, path, data)
    }

    execRequests(actions) {
        return Promise.all(
                actions.map(({ method, path, data = {} }) => {
                    return this[method](path, data)
                })
            )
    }
}

module.exports = CustomPage