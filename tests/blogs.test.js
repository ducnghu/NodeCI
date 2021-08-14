const Page = require('./helpers/page')

let page

beforeEach(async () => {
    page = await Page.build()
    await page.goto('http://localhost:3000')
})

afterEach(async () => {
    await page.close()
})

describe('When logged in', () => {
    beforeEach(async () => {
        await page.login()
        await page.goto('http://localhost:3000/blogs')
        
        await page.click('a.btn-floating')
    
    })

    it('can see blog create form', async () => {
        const label = await page.getContentsOf('form label')
    
        expect(label).toEqual('Blog Title')
    })
    
    describe('When using valid form inputs', () => {
        beforeEach(async () => {
            await page.type('.title input', 'This is test title')
            await page.type('.content input', 'This is test content')
            await page.click('form button')
        })
                
        it('takes user to review screen', async () => {
            const text = await page.getContentsOf('h5')

            expect(text).toEqual('Please confirm your entries')
        })
                
        it('saving add blog to blog page', async () => {
            await page.click('button.green')
            await page.waitForSelector('.card')

            const title = await page.getContentsOf('.card-title')
            const content = await page.getContentsOf('.card-content p')

            expect(title).toEqual('This is test title')
            expect(content).toEqual('This is test content')
        })

    })
    
    describe('When using invalid form inputs', () => {
        beforeEach(async () => {
            await page.click('form button')
        })
                
        it('show an error message', async () => {
            const titleError = await page.getContentsOf('.title .red-text')
            const contentError = await page.getContentsOf('.content .red-text')

            expect(titleError).toEqual('You must provide a value')
            expect(contentError).toEqual('You must provide a value')
        })

    })
})

describe('When not logged in', () => {
    const actions = [
        {
            method: 'get',
            path: '/api/blogs'
        },
        {
            method: 'post',
            path: '/api/blogs',
            data: {
                title: 'T',
                content: 'C',
            }
        }
    ]
    it('prohibits all actions related to blog', async () => {
        const results = await page.execRequests(actions)

        results.forEach(result => {
            expect(result).toEqual({ error: 'You must log in!' })
        });
    })
})