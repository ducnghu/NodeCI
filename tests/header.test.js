const puppeteer = require('puppeteer')

const Page = require('./helpers/page')

let page

beforeEach(async () => {
    page = await Page.build()

    await page.goto('http://localhost:3000')
})

afterEach(async () => {
    await page.close()
})

it('show the correct header text', async () => {
    const text = await page.getContentsOf('a.brand-logo')

    expect(text).toEqual('Blogster')
})

it('click login oauth flow', async () => {
    await page.click('.right a')
    const url = await page.url()
    
    expect(url).toMatch(/accounts\.google\.com/)
})

it('show logout button when login', async () => {
    await page.login()
    
    const text = await page.getContentsOf('a[href="/auth/logout"]')

    expect(text).toEqual('Logout')
})
