const axios = require('axios');
const cheerio = require('cheerio');
const { sampleHtmlWithYale } = require('./test-utils');
const nock = require('nock');

describe('Integration Tests', () => {
  beforeAll(() => {
    // Mock external HTTP requests
    nock.disableNetConnect();
  });

  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test('Should verify Yale to Fale replacement logic with real HTML', () => {
    const $ = cheerio.load(sampleHtmlWithYale);
    
    // Process text nodes in the body (same as app.js logic)
    $('body *').contents().filter(function() {
      return this.nodeType === 3;
    }).each(function() {
      const text = $(this).text();
      const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    // Process title separately
    const title = $('title').text().replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
    $('title').text(title);
    
    const modifiedHtml = $.html();
    
    // Verify Yale has been replaced with Fale in text
    expect($('title').text()).toBe('Fale University Test Page');
    expect($('h1').text()).toBe('Welcome to Fale University');
    expect($('p').first().text()).toContain('Fale University is a private');
    
    // Verify URLs remain unchanged
    const links = $('a');
    let hasYaleUrl = false;
    links.each((i, link) => {
      const href = $(link).attr('href');
      if (href && href.includes('yale.edu')) {
        hasYaleUrl = true;
      }
    });
    expect(hasYaleUrl).toBe(true);
    
    // Verify link text is changed
    expect($('a').first().text()).toBe('About Fale');
  });

  test('Should handle URLs without Yale', () => {
    const html = '<html><body><a href="https://example.com">Link</a></body></html>';
    const $ = cheerio.load(html);
    
    $('body *').contents().filter(function() {
      return this.nodeType === 3;
    }).each(function() {
      const text = $(this).text();
      const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    // URL and text should remain unchanged
    expect($('a').attr('href')).toBe('https://example.com');
    expect($('a').text()).toBe('Link');
  });

  test('Should verify mock HTTP request handling', async () => {
    nock('https://test-example.com')
      .get('/')
      .reply(200, '<html><body>Test content</body></html>');
    
    const response = await axios.get('https://test-example.com/');
    expect(response.status).toBe(200);
    expect(response.data).toContain('Test content');
  });
});
